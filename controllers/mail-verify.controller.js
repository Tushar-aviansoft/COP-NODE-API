const httpStatus = require("http-status");
const mailVerifyServices = require("../services/mail-verify.services");

const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await mailVerifyServices.sendOTP(email);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const data = await mailVerifyServices.verifyOTP(email, otp);

    res.status(httpStatus.OK).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
