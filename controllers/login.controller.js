const httpStatus = require("http-status");
const loginServices = require("../services/login.services");

const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    const data = await loginServices.sendOtp(mobile);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    const {
      token,
      sign_up,
      name,
      contact_no,
      profile_pic,
      toll_count,
      fuel_count,
      statusCode,
      message,
    } = await loginServices.verifyOtp(mobile, otp);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 30 * 60 * 1000,
    };

    if (process.env.DOMAIN) {
      cookieOptions.domain = process.env.DOMAIN;
    }

    res.cookie("jwt", token, cookieOptions);
    res
      .status(httpStatus.OK)
      .json({ sign_up, name, contact_no, profile_pic, toll_count, fuel_count, statusCode, message });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    const data = await loginServices.resendOtp(mobile);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
};
