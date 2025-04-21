const carInsuranceService = require("../services/car-insurance.services");
const httpStatus = require("http-status");

const carInsurance = async (req, res, next) => {
  try {
    const { brand, model, full_name, email, contact_no, city } = req.body;
    const auth = req.auth;
    const data = await carInsuranceService.carInsurance(
      auth,
      brand,
      model,
      full_name,
      email,
      contact_no,
      city
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { carInsurance };
