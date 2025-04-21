const upcomingCarsService = require("../services/upcoming-cars.services");
const httpStatus = require("http-status");

const models = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      launchMonth = "",
      budget = "",
      page = 1,
      limit = 10,
      brand,
      model
    } = req.query;

    const data = await upcomingCarsService.models(
      brands,
      carTypes,
      launchMonth,
      budget,
      page,
      limit,
      brand,
      model
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

const launchMonth = async (req, res, next) => {
  try {
    const data = await upcomingCarsService.launchMonth();

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const budget = async (req, res, next) => {
  try {
    const { brands = "", carTypes = "", launchMonth = "" } = req.query;
    const data = await upcomingCarsService.budget(
      brands,
      carTypes,
      launchMonth
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const brands = async (req, res, next) => {
  try {
    const { carTypes = "", launchMonth = "", budget = "" } = req.query;
    const data = await upcomingCarsService.brands(
      carTypes,
      launchMonth,
      budget
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const carTypes = async (req, res, next) => {
  try {
    const { brands = "", launchMonth = "", budget = "" } = req.query;
    const data = await upcomingCarsService.carTypes(
      brands,
      launchMonth,
      budget
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  launchMonth,
  brands,
  carTypes,
  budget,
  models,
};
