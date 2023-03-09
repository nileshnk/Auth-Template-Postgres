import * as nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function Transporter() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "apikey",
      pass: "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", // generated ethereal password
    },
  });

  return transporter;
}
