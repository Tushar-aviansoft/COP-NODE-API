const { City } = require("../config/constant");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const cities = async () => {
  const query = () => {
    return db("cop_city_ms")
      .rightJoin("cop_pe_ms", "cop_pe_ms.city_id", "cop_city_ms.city_id")
      .whereNotNull("cop_pe_ms.city_id")
      .select("cop_city_ms.uuid as id", "cop_city_ms.city_name")
      .groupBy("cop_pe_ms.city_id", "cop_city_ms.city_name");
  };
  try {
    const result = await query();
    const citiesWithPopularity = result.map((city) => ({
      ...city,
      isPopular: City.popularCity.includes(city.city_name),
    }));
    return citiesWithPopularity;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const saveCity = async (auth, city) => {
  try {
    await db("cop_customers")
      .update({
        selected_city_id: city,
      })
      .where("customer_id", auth);
    return { message: "City Saved!" };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const allCities = async () => {
  const query = () => {
    return db("cop_city_ms")
      .select("cop_city_ms.uuid as id", "cop_city_ms.city_name")
      .where("cop_city_ms.status", 1);
  };
  try {
    const result = await query();

    return result;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { cities, saveCity, allCities };
