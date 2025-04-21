const httpStatus = require("http-status");
const evChargingStationService = require("../services/ev-charging-station.services");

const cities = async (req, res, next) => {
  try {
    const cities = await evChargingStationService.cities(req);

    res.status(httpStatus.OK).send(cities);
  } catch (error) {
    next(error);
  }
};

const evStations = async (req, res, next) => {
  try {
    const { city, page, limit, search } = req.query;

    const evStations = await evChargingStationService.evStations(
      city,
      page,
      limit,
      search
    );

    res.status(httpStatus.OK).send(evStations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  cities,
  evStations,
};
