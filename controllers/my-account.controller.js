const httpStatus = require("http-status");
const myAccountServices = require("../services/my-account.services");

const userDetail = async (req, res, next) => {
  try {
    const auth = req.auth;
    const data = await myAccountServices.userDetail(auth);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const updateBasicDetail = async (req, res, next) => {
  try {
    const auth = req.auth;
    const { name, email, dob, anniversary_date } = req.body;
    const data = await myAccountServices.updateBasicDetail(
      auth,
      name,
      email,
      dob,
      anniversary_date
    );
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const updateAddress = async (req, res, next) => {
  try {
    const auth = req.auth;
    const { address_1, address_2 } = req.body;
    const data = await myAccountServices.updateAddress(
      auth,
      address_1,
      address_2
    );
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const updateProfile = async (req, res, next) => {
  try {
    const auth = req.auth;
    const { profile_pic } = req.body;
    const data = await myAccountServices.updateProfile(auth, profile_pic);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userDetail,
  updateBasicDetail,
  updateAddress,
  updateProfile,
};
