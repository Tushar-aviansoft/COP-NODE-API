const { min } = require("../config/database");
const newlyLaunchedCarsService = require("../services/newly-launched-cars.services");
const httpStatus = require("http-status");

const models = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      launchMonth = "",
      minPrice = "",
      maxPrice = "",
      sort = "",
      page = 1,
      limit = 10,
    } = req.query;
    const city = req.city;
    const auth = req.auth;
    const data = await newlyLaunchedCarsService.models(
      brands,
      carTypes,
      launchMonth,
      minPrice,
      maxPrice,
      sort,
      city,
      page,
      limit,
      auth
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const launchMonth = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await newlyLaunchedCarsService.launchMonth(
      brands,
      carTypes,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const budget = async (req, res, next) => {
  try {
    const { brands = "", carTypes = "", launchMonth = "" } = req.query;
    const data = await newlyLaunchedCarsService.budget(
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
    const {
      carTypes = "",
      launchMonth = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await newlyLaunchedCarsService.brands(
      carTypes,
      launchMonth,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const carTypes = async (req, res, next) => {
  try {
    const {
      brands = "",
      launchMonth = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await newlyLaunchedCarsService.carTypes(
      brands,
      launchMonth,
      minPrice,
      maxPrice
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
