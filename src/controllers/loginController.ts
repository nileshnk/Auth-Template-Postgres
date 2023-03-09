import { RequestHandler, Request, Response, response } from "express";
import * as argon2 from "argon2";
import JWT, { Secret } from "jsonwebtoken";
import { createCipheriv } from "crypto";
import * as randomstring from "randomstring";
import { PrismaClient } from "@prisma/client";
import { ResponseConstants } from "../constants/ResponseConstants";
import { Transporter } from "../helpers/nodemailer";
import {
  UserLoginSchema,
  UserRegisterSchema,
  ResetPasswordSchema,
} from "../schema/JoiSchema";
const prisma = new PrismaClient();

//Initializing all the Secret Keys from .env
let JWT_SECRET: Secret;
let ENCRYPT_KEY: string;
let IV: string;
if (
  process.env.ENCRYPT_KEY &&
  process.env.JWT_SECRET &&
  process.env.IV !== undefined
) {
  ENCRYPT_KEY = process.env.ENCRYPT_KEY;
  JWT_SECRET = process.env.JWT_SECRET;
  IV = process.env.IV;
} else {
  throw new Error("Required keys not available in .env file");
}

export const getLogin: RequestHandler = (req: Request, res: Response) => {
  res.render("login");
};
export const UserLogin: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const userData = req.body;

  try {
    //Joi Validation
    const validate = UserLoginSchema.validate(userData);
    if (validate.error !== undefined) {
      throw new Error(`${validate.error}`);
    }

    //Search User
    const userFind = await prisma.user.findFirst({
      where: { email: userData.email },
    });

    if (!userFind) {
      console.log("couldn't find user!");

      return res.status(401).json({
        status: false,
        message: ResponseConstants.RES_INVALID_CREDENTIALS,
      });
    } else {
      //Verify password
      const verify = await argon2.verify(userFind.password, userData.password);
      if (!verify) {
        return res.status(401).json({
          status: false,
          message: ResponseConstants.RES_INVALID_CREDENTIALS,
        });
      } else {
        //sending jwt token!
        const token = JWT.sign(
          {
            id: userFind.id,
            name: userFind.firstName + " " + userFind.lastName,
          },
          JWT_SECRET,
          {
            expiresIn: "2 days",
          }
        );

        const cipher = createCipheriv("aes-256-gcm", ENCRYPT_KEY, IV);
        const encKey = cipher.update("Authorization", "utf-8", "hex");
        const encVal = cipher.update(`Bearer ${token}`, "utf-8", "hex");

        res.setHeader(
          "Set-Cookie",
          `${encKey}=${encVal};Max-Age=864000;SameSite;HttpOnly`
        );

        // if you don't want to encrypt token, remove above code and replace with below code.
        // res.setHeader(
        //   "Set-Cookie",
        //   `Authorization=Bearer ${token};Max-Age=864000;SameSite;HttpOnly`
        // );

        console.log(`User logged in: ${userFind.firstName}`);
        return res.status(200).json({
          status: true,
          message: ResponseConstants.RES_LOGIN_SUCCESS,
        });
      }
    }
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
};

export const getSignup: RequestHandler = (req: Request, res: Response) => {
  res.render("signup");
};

export const UserSignup: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const userData = req.body;
  try {
    //Joi Validation
    const validate = UserRegisterSchema.validate(userData);
    if (validate.error !== undefined) {
      throw new Error(`${validate.error}`);
    }
    //hash password
    const hash = await argon2.hash(userData.password);
    userData.password = hash;
    delete userData.confirmPassword;

    //store in database
    await prisma.user.create({ data: userData });
    res
      .status(201)
      .json({ status: true, message: ResponseConstants.RES_USER_CREATED });
  } catch (err: any) {
    console.log("Error creating!", err.message);
    if (err.code === "P2002") {
      return res.status(406).json({
        status: false,
        message: ResponseConstants.RES_USER_EXISTS,
      });
    }
    return res.status(500).json({ status: false, message: err.message });
  }
};

export const logout: RequestHandler = (req: Request, res: Response) => {
  const authCookieKey = Object.keys(req.cookies)[0];
  res.clearCookie(authCookieKey);
  res.redirect("/");
};

export const resetPasswordCheck: RequestHandler = async (
  req: Request,
  res: Response
) => {
  //get the email from request body
  const email: string = req.body.email;

  const findUser = await prisma.user.findFirst({ where: { email: email } });
  if (!findUser) {
    return res.status(404).json({
      status: false,
      message: ResponseConstants.RES_USER_NOT_FOUND,
    });
  } else {
    //generate token for the user
    const token: string = randomstring.generate();
    //save the token in db
    const saveToken = await prisma.resetToken.create({
      data: {
        userId: findUser.id,
        token: token,
      },
    });
    //mail the token to the user
    if (!saveToken) {
      res
        .status(404)
        .json({ status: false, message: ResponseConstants.RES_ERR_TOKEN_GEN });
      throw new Error("Error generating token!");
    } else {
      const transporter = await Transporter();
      try {
        let info = await transporter.sendMail({
          from: '"Nilesh" <nile.nil2@gmail.com>', // sender address
          to: email, // list of receivers
          subject: "Reset Password", // Subject line
          text: token, // plain text body
          html: `<b>Hi ${findUser.firstName} ${findUser.lastName}! Here is you password reset link: </b><a href=${process.env.APP_URL}/resetPassword?token=${token}>Reset Password</a><br><h3>${token}</h3><br>Token will Expire in 15 Minutes!`, // html body
        });
        // console.log("Message sent for reset password: %s", info.messageId);
        res.status(201).json({
          status: true,
          message: ResponseConstants.RES_SUCCESS_RESET_LINK_EMAIL,
        });
      } catch (err: any) {
        console.log(err.message);
        res.status(500).json({ status: false, message: err.message });
      }
    }
  }
};

export const getResetPassword: RequestHandler = (
  req: Request,
  res: Response
) => {
  res.render("resetpassword", { token: req.query.token });
};
export const resetPassword: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { token, password, confirmPassword } = req.body;
  try {
    const checkToken = await prisma.resetToken.findFirst({
      where: {
        token: token,
      },
    });
    if (checkToken) {
      const tokenTime = checkToken.createdAt;
      const validity = Date.now() - tokenTime.getTime();

      if (validity > 900000) {
        //token expired
        await prisma.resetToken.delete({
          where: {
            token: token,
          },
        });

        return res.status(410).json({
          status: false,
          message: ResponseConstants.RES_ERR_TOKEN_EXPIRED,
        });
      } else {
        //change password
        //joi validation
        const validate = ResetPasswordSchema.validate({
          password,
          confirmPassword,
        });
        if (validate.error !== undefined) {
          throw new Error(`${validate.error}`);
        }
        //find user
        const userId = checkToken.userId;
        await prisma.resetToken.delete({
          where: { token: token },
        });
        const hashedPassword = await argon2.hash(password);

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            password: hashedPassword,
          },
        });
      }

      res.status(200).json({
        status: true,
        message: ResponseConstants.RES_SUCCESS_PASS_RESET,
      });
    } else {
      res.status(500).json({
        status: false,
        message: ResponseConstants.RES_ERR_TOKEN_NOT_GEN,
      });
    }
  } catch (err) {
    console.log(err);
  }
};
