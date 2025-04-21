const httpStatus = require("http-status");
const deleteAccountServices = require("../services/delete-account.services");

const deleteAccount = async (req, res, next) => {
  try {
    const auth = req.auth;
    const data = await deleteAccountServices.deleteAccount(auth);
    res.clearCookie("jwt");
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteAccount,
};
