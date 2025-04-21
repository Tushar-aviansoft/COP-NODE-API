const cityService = require("../services/city.services");
const httpStatus = require("http-status");
// const redis = require("../config/redisClient");

const cityData = async (req, res, next) => {
  try {
    const cities = await cityService.cities();

    res.status(httpStatus.OK).send(cities);
  } catch (error) {
    next(error);
  }
};
const saveCity = async (req, res, next) => {
  try {
    const auth = req.auth;
    const city = req.city;
    const data = await cityService.saveCity(auth, city);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const allCities = async (req, res, next) => {
  try {
    const data = await cityService.allCities();
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
module.exports = { cityData, saveCity, allCities };
