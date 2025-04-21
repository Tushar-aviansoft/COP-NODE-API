const evCarsService = require("../services/ev-cars.services");
const httpStatus = require("http-status");

const brands = async (req, res, next) => {
  try {
    const brands = await evCarsService.brands(req);

    res.status(httpStatus.OK).send(brands);
  } catch (error) {
    next(error);
  }
};

const models = async (req, res, next) => {
  try {
    const { minPrice, maxPrice, brand } = req.query;
    const city = req.city;
    const auth = req.auth;

    const models = await evCarsService.models(
      minPrice,
      maxPrice,
      brand,
      city,
      auth
    );

    res.status(httpStatus.OK).send(models);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  brands,
  models,
};
