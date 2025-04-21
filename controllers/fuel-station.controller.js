const httpStatus = require("http-status");
const fuelStationService = require("../services/fuel-station.services");

const cities = async (req, res, next) => {
  try {
    const cities = await fuelStationService.cities(req);

    res.status(httpStatus.OK).send(cities);
  } catch (error) {
    next(error);
  }
};

const fuelStations = async (req, res, next) => {
  try {
    const { city, page, limit, search } = req.query;

    const fuelStations = await fuelStationService.fuelStations(
      city,
      page,
      limit,
      search
    );

    res.status(httpStatus.OK).send(fuelStations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  cities,
  fuelStations,
};
