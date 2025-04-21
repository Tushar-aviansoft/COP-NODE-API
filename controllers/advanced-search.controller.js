const advancedSearchService = require("../services/advanced-search.services");
const httpStatus = require("http-status");

const models = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
      sort = "",
      page = 1,
      limit = 10,
    } = req.query;
    const city = req.city;
    const auth = req.auth;

    const data = await advancedSearchService.models(
      brands,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      exterior,
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
const variants = async (req, res, next) => {
  try {
    const {
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const city = req.city;
    const { brand, model } = req.params;
    const data = await advancedSearchService.variants(
      brand,
      model,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      exterior,
      minPrice,
      maxPrice,
      city
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const budget = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
    } = req.query;
    const data = await advancedSearchService.budget(
      brands,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      exterior
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
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.brands(
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      exterior,
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
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.carTypes(
      brands,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const fuelTypes = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.fuelTypes(
      brands,
      carTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const transmission = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.transmission(
      brands,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      safety,
      interior,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const engine = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      transmission = "",
      driveTrain = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.engine(
      brands,
      carTypes,
      fuelTypes,
      transmission,
      driveTrain,
      safety,
      interior,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const driveTrain = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      transmission = "",
      safety = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.driveTrain(
      brands,
      carTypes,
      fuelTypes,
      engine,
      transmission,
      safety,
      interior,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const safety = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      interior = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.safety(
      brands,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      interior,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const interior = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      exterior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.interior(
      brands,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      exterior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const exterior = async (req, res, next) => {
  try {
    const {
      brands = "",
      carTypes = "",
      fuelTypes = "",
      engine = "",
      driveTrain = "",
      transmission = "",
      safety = "",
      interior = "",
      minPrice = "",
      maxPrice = "",
    } = req.query;
    const data = await advancedSearchService.exterior(
      brands,
      carTypes,
      fuelTypes,
      engine,
      driveTrain,
      transmission,
      safety,
      interior,
      minPrice,
      maxPrice
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  brands,
  carTypes,
  fuelTypes,
  engine,
  transmission,
  driveTrain,
  safety,
  interior,
  exterior,
  budget,
  models,
  variants,
};
