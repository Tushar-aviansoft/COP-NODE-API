const { Services } = require("../config/constant");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const carInsurance = async (
  auth,
  brand,
  model,
  full_name,
  email,
  contact_no,
  city
) => {
  const trx = await db.transaction();
  try {
    const ids = await trx("cop_models")
      .select("cop_models.model_id", "cop_brands_ms.brand_id")
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .where("cop_brands_ms.uuid", brand)
      .andWhere("cop_models.uuid", model)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .first();

    if (!ids) {
      throw new ApiError(httpStatus.NOT_FOUND, "Brand or model not found");
    }
    const { brand_id, model_id } = ids;
    const cityQuery = await trx("cop_city_ms")
      .select("cop_city_ms.city_id")
      .where("cop_city_ms.uuid", city)
      .andWhere("cop_city_ms.status", 1)
      .first();

    if (!cityQuery) {
      throw new ApiError(httpStatus.NOT_FOUND, "City not found");
    }
    const { city_id } = cityQuery;

    await trx("cop_services_lead").insert({
      category: Services.carInsurance,
      brand_id,
      model_id,
      full_name,
      email,
      contact_no,
      city_id,
      uuid: db.raw("UUID()"),
    });

    await trx.commit();
    return { message: "Insurance submitted successfully" };
  } catch (err) {
    await trx.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { carInsurance };
