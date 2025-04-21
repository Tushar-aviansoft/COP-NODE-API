const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");

const cities = async () => {
  const query = db
    .select("cop_city_ms.uuid as id", "cop_city_ms.city_name")
    .from("cop_city_ms")
    .innerJoin("cop_evs_ms", "cop_evs_ms.city_id", "cop_city_ms.city_id")
    .where("cop_evs_ms.status", 1)
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

const evStations = async (city, page = 1, limit = 12, search) => {
  if (!city) {
    throw new ApiError(httpStatus.PRECONDITION_REQUIRED, "city is required");
  }
  const offset = (page - 1) * limit;

  const query = db
    .select(
      "cop_evs_ms.uuid as id",
      "cop_evs_ms.evs_name",
      "cop_evs_ms.evs_address",
      "cop_evs_ms.evs_location",
      db.raw("COUNT(*) OVER () AS total_count")
    )
    .from("cop_evs_ms")
    .innerJoin("cop_city_ms", "cop_city_ms.city_id", "cop_evs_ms.city_id")
    .where("cop_city_ms.uuid", city);

  if (search) {
    query.andWhere(function () {
      this.where("cop_evs_ms.evs_name", "LIKE", `%${search}%`).orWhere(
        "cop_evs_ms.evs_address",
        "LIKE",
        `%${search}%`
      );
    });
  }

  query.where("cop_evs_ms.status", 1).distinct().limit(limit).offset(offset);

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
  evStations,
};
