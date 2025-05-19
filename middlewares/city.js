const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const {
  DefaultCity
} = require("../config/constant");

const validateCity =
  (isRequired = true) =>
    async (req, res, next) => {
      const city = req.cookies["city"] ?? DefaultCity.surat;
      if (isRequired && !city) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "City is required."));
      }
      if (city) {
        const cityResult = await db("cop_city_ms")
          .select("city_id")
          .where("uuid", city)
          .first();
        // const cityId = cityResult?.city_id ?? null;
        const cityId = cityResult?.city_id ?? DefaultCity.surat;
        if (isRequired && !cityId) {
          return next(new ApiError(httpStatus.NOT_FOUND, "No city found."));
        }
        req.city = cityId;
      }
      next();
    };

module.exports = validateCity;
