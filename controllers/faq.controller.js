const httpStatus = require("http-status");
const faqService = require("../services/faq.services");

const faq = async (req, res, next) => {
  try {
    const city = req.city ?? null;
    const { brand, model, variant } = req.params;
    const faq = await faqService.faq(brand, model, variant, city);

    res.status(httpStatus.OK).send(faq);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  faq,
};
