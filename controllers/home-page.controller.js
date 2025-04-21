const homePageService = require("../services/home-page.services");
const httpStatus = require("http-status");
// const redis = require("../config/redisClient");
// const {
//   evBannersKey,
//   carsByBudgetKey,
//   headBannersKey,
//   upComingBannersKey,
//   carTypesKey,
// } = require("../config/cacheKeys");

const headBanners = async (req, res, next) => {
  try {
    // const cacheKey = headBannersKey.key;

    // const cachedData = await redis.get(cacheKey);
    // if (cachedData) {
    //   return res.status(httpStatus.OK).send(JSON.parse(cachedData));
    // }

    const data = await homePageService.headBanners();

    // await redis.set(
    //   cacheKey,
    //   JSON.stringify(data),
    //   "EX",
    //   headBannersKey.expiration
    // );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const upComingBanners = async (req, res, next) => {
  try {
    // const cacheKey = upComingBannersKey.key;

    // const cachedData = await redis.get(cacheKey);
    // if (cachedData) {
    //   return res.status(httpStatus.OK).send(JSON.parse(cachedData));
    // }

    const data = await homePageService.upComingBanners();

    // await redis.set(
    //   cacheKey,
    //   JSON.stringify(data),
    //   "EX",
    //   upComingBannersKey.expiration
    // );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const evBanners = async (req, res, next) => {
  const city = req.city;
  try {
    const data = await homePageService.evBanners(city);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const carTypes = async (req, res, next) => {
  try {
    // const cacheKey = carTypesKey.key;

    // const cachedData = await redis.get(cacheKey);
    // if (cachedData) {
    //   return res.status(httpStatus.OK).send(JSON.parse(cachedData));
    // }

    const data = await homePageService.carTypes();

    // await redis.set(
    //   cacheKey,
    //   JSON.stringify(data),
    //   "EX",
    //   carTypesKey.expiration
    // );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

const carsByBudget = async (req, res, next) => {
  try {
    const city = req.city;
    const auth = req.auth;

    const data = await homePageService.carsByBudget(city, auth);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const popularCars = async (req, res, next) => {
  const city = req.city;
  const auth = req.auth;
  try {
    const data = await homePageService.trendingCars(city, "Popular Cars", auth);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const evCars = async (req, res, next) => {
  const city = req.city;
  const auth = req.auth;
  try {
    const data = await homePageService.trendingCars(city, "EV Cars", auth);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const newLaunchedCars = async (req, res, next) => {
  const city = req.city;
  const auth = req.auth;
  try {
    const data = await homePageService.newLaunchedCars(city, auth);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  headBanners,
  carTypes,
  upComingBanners,
  evBanners,
  carsByBudget,
  newLaunchedCars,
  popularCars,
  evCars,
};
