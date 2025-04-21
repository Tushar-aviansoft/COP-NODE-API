const httpStatus = require("http-status");
const logOut = async (req, res, next) => {
  try {
    res.clearCookie("jwt");

    res.status(httpStatus.OK).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logOut,
};
