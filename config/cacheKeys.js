const { trendingCars } = require("../services/home-page.services");

const headBannersKey = {
  key: "head_banners",
  expiration: 1000,
};
const carTypesKey = {
  key: "car_types",
  expiration: 3600,
};
const upComingBannersKey = {
  key: "upcoming_banners",
  expiration: 1000,
};
const brandsKey = {
  key: "brands",
  expiration: 3600,
};

const cityKey = "cities";
const carsByBudgetKey = {
  key: "cars_by_budget",
  expiration: 1,
};
const trendingCarsKey = {
  key: "trending_cars",
  expiration: 1,
};
const evBannersKey = {
  key: "ev_banners",
  expiration: 1,
};

module.exports = {
  headBannersKey,
  carTypesKey,
  brandsKey,
  cityKey,
  upComingBannersKey,
  carsByBudgetKey,
  trendingCarsKey,
  evBannersKey,
};
