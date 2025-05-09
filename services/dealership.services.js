const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");

const brands = async () => {
  const query = db("cop_dealer")
    .select(
      "cop_brands_ms.uuid as id",
      "cop_brands_ms.brand_name",
      db.raw(`
          GROUP_CONCAT(
            DISTINCT cop_city_ms.uuid ORDER BY cop_city_ms.city_name ASC
          ) AS city_ids,
          GROUP_CONCAT(
            DISTINCT cop_city_ms.city_name ORDER BY cop_city_ms.city_name ASC
          ) AS city_names
        `)
    )
    .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_dealer.brand_id")
    .join("cop_city_ms", "cop_city_ms.city_id", "cop_dealer.city_id")
    .where("cop_dealer.status", 1)
    .andWhere("cop_city_ms.status", 1)
    .andWhere("cop_brands_ms.status", 1)
    .groupBy("cop_brands_ms.brand_name", "cop_brands_ms.uuid");

  try {
    const data = await query;

    const result = data.map((value) => {
      const cityIds = value.city_ids ? value.city_ids.split(",") : [];
      const cityNames = value.city_names ? value.city_names.split(",") : [];

      const cities = cityIds.map((id, index) => ({
        id,
        city_name: cityNames[index] || "",
      }));

      return {
        id: value.id,
        brand_name: value.brand_name,
        cities: cities,
      };
    });

    return result || [];
  } catch (err) {
    console.error("Error fetching brands and cities:", err);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch brands and cities"
    );
  }
};

const dealerships = async (brand, city, page = 1, limit = 12, search) => {
  if (!brand && !city) {
    throw new ApiError(
      httpStatus.PRECONDITION_REQUIRED,
      "brand & city is required"
    );
  }
  const offset = (page - 1) * limit;

  const query = db
    .select(
      "cop_dealer.uuid as id",
      "cop_dealer.company_name",
      "cop_dealer.dealer_name",
      "cop_dealer.address",
      "cop_dealer.phone_no",
      "cop_dealer.map_location",
      "cop_dealer.email",
      db.raw("COUNT(*) OVER () AS total_count")
    )
    .from("cop_dealer")
    .innerJoin("cop_city_ms", "cop_city_ms.city_id", "cop_dealer.city_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_dealer.brand_id")
    .where("cop_city_ms.uuid", city)
    .andWhere("cop_brands_ms.brand_name", brand);

  if (search) {
    query.andWhere(function () {
      this.where("cop_dealer.company_name", "LIKE", `%${search}%`)
        .orWhere("cop_dealer.dealer_name", "LIKE", `%${search}%`)
        .orWhere("cop_dealer.address", "LIKE", `%${search}%`);
    });
  }

  query.where("cop_dealer.status", 1).distinct().limit(limit).offset(offset);

  try {
    const data = (await query) || [];

    data?.forEach((dealer) => {
      dealer.email = dealer?.email.split(",");
    });

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
  brands,
  dealerships,
};
