const carLoanService = require("../services/car-loan.services");
const httpStatus = require("http-status");

const carLoan = async (req, res, next) => {
  try {
    const { full_name, email, contact_no, city } = req.body;
    const data = await carLoanService.carLoan(
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

module.exports = { carLoan };
