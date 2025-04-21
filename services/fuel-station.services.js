const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");

const cities = async () => {
  const query = db
    .select("cop_city_ms.uuid as id", "cop_city_ms.city_name")
    .from("cop_city_ms")
    .innerJoin(
      "cop_f_stations_ms",
      "cop_f_stations_ms.city_id",
      "cop_city_ms.city_id"
    )
    .where("cop_f_stations_ms.status", 1)
    .andWhere("cop_city_ms.status", 1)
    .orderBy("cop_city_ms.city_name", "asc")
    .distinct();

  try {
    const data = await query;

    return data;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const fuelStations = async (city, page = 1, limit = 12, search) => {
  if (!city) {
    throw new ApiError(httpStatus.PRECONDITION_REQUIRED, "city is required");
  }
  const offset = (page - 1) * limit;

  const query = db
    .select(
      "cop_f_stations_ms.uuid as id",
      "cop_f_stations_ms.f_station_name",
      "cop_f_stations_ms.f_station_address",
      "cop_f_stations_ms.f_station_location",
      "cop_f_stations_ms.contact_no",
      db.raw("COUNT(*) OVER () AS total_count")
    )
    .from("cop_f_stations_ms")
    .innerJoin(
      "cop_city_ms",
      "cop_city_ms.city_id",
      "cop_f_stations_ms.city_id"
    )
    .where("cop_city_ms.uuid", city);

  if (search) {
    query.andWhere(function () {
      this.where(
        "cop_f_stations_ms.f_station_name",
        "LIKE",
        `%${search}%`
      ).orWhere("cop_f_stations_ms.f_station_address", "LIKE", `%${search}%`);
    });
  }

  query
    .where("cop_f_stations_ms.status", 1)
    .distinct()
    .limit(limit)
    .offset(offset);

  try {
    const data = await query;
    const totalRecords = data.length ? data[0].total_count : 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data,
      totalRecords,
      totalPages,
      currentPage: Number(page),
      perPage: Number(limit),
    };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = {
  cities,
  fuelStations,
};
