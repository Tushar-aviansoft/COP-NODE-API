const bookTestDriveService = require("../services/book-test-drive.services");
const httpStatus = require("http-status");

const preferences = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const data = await bookTestDriveService.preferences(brand, model);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const bookTestDrive = async (req, res, next) => {
  try {
    const {
      name,
      email,
      address,
      location,
      fuel,
      transmission,
      estimated_purchase_date,
      dealer,
    } = req.body;
    const { brand, model } = req.params;
    const auth = req.auth;
    const data = await bookTestDriveService.bookTestDrive(
      auth,
      brand,
      model,
      name,
      email,
      address,
      location,
      fuel,
      transmission,
      estimated_purchase_date,
      dealer
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { bookTestDrive, preferences };
