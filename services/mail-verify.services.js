const db = require("../config/database");
const transporter = require("../config/mailService");
const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const sendOTP = async (email) => {
  const otpCode = crypto.randomInt(100000, 999999).toString();

  try {
    await db.transaction(async (trx) => {
      await trx("mail_otp").where("email", email).del();

      await trx("mail_otp").insert({
        email,
        otp_code: otpCode,
      });
    });

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Caronphone Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h3 style="color: #333333;">Your OTP Code</h3>
              <p style="margin-bottom: 15px;">Your OTP code is: <strong>${otpCode}</strong></p>
              <p style="margin-bottom: 15px;">Please use this code to verify your email address.</p>
              <p style="color: #999999;">This OTP is valid only for 2 minutes.</p>
              <p style="color: #999999; margin-top: 20px;">
                  If you did not request this OTP, please ignore this email.
              </p>
              <p style="color: #999999; margin-top: 20px;">
                  If you have any questions, feel free to contact us at <a href="mailto:support@caronphone.com" style="color: #007bff;">support@caronphone.com</a>.
              </p>
          </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.MAIL_USERNAME,
      to: email,
      subject: "Caronphone Email Verification",
      html: htmlTemplate,
    });

    return { email };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const verifyOTP = async (email, otpCode) => {
  try {
    const existingOtp = await db("mail_otp")
      .where({ email })
      .andWhere("expires_at", ">", db.fn.now())
      .first();

    if (!existingOtp) {
      return { valid: false, message: "Expired OTP" };
    }

    if (existingOtp.otp_code !== otpCode) {
      return { valid: false, message: "Invalid OTP" };
    }
    
    await db("mail_otp").where({ id: existingOtp.id }).del();
    return { valid: true, message: "OTP verified" };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { sendOTP, verifyOTP };
