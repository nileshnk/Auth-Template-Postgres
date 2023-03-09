import { Router } from "express";
import {
  UserLogin,
  UserSignup,
  getLogin,
  getSignup,
  logout,
  resetPassword,
  getResetPassword,
  resetPasswordCheck,
} from "../controllers/loginController";
import { auth } from "../middlewares/jwt_verification";
import { home } from "../controllers/homeController";
import { unhandledRequest } from "../controllers/unhandled.route";

const Route = Router();

//Protected Routes
Route.route("/").get(auth, home);

//Unprotected Routes
Route.route("/login").get(getLogin).post(UserLogin);
Route.route("/signup").get(getSignup).post(UserSignup);
Route.route("/logout").post(logout);
Route.route("/resetPasswordCheck").post(resetPasswordCheck);
Route.route("/resetPassword").get(getResetPassword).post(resetPassword);

Route.route("/*").get(unhandledRequest);
export default Route;
