const httpStatus = require("http-status");
const compareCarsServices = require("../services/compare-cars.services");

const compare = async (req, res, next) => {
  try {
    const city = req.city;
    const { slug } = req.params;
    const compare = await compareCarsServices.compare(city, slug);

    res.status(httpStatus.OK).send(compare);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  compare,
};
