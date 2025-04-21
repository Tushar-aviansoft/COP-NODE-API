const b2bInquiryService = require("../services/b2b-inquiry.services");
const httpStatus = require("http-status");

const b2bInquiry = async (req, res, next) => {
  try {
    const { full_name, contact_no, email, dealer_name, dealer_address } =
      req.body;
    const data = await b2bInquiryService.b2bInquiry(
      full_name,
      contact_no,
      email,
      dealer_name,
      dealer_address
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { b2bInquiry };
