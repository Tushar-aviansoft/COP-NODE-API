const { Services } = require("../config/constant");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const carLoan = async (full_name, email, contact_no, city) => {
  const trx = await db.transaction();
  try {
    const ids = await trx("cop_city_ms")
      .select("cop_city_ms.city_id")
      .where("cop_city_ms.uuid", city)
      .andWhere("cop_city_ms.status", 1)
      .first();

    if (!ids) {
      throw new ApiError(httpStatus.NOT_FOUND, "City not found");
    }
    const { city_id } = ids;

    await trx("cop_services_lead").insert({
      category: Services.carLoan,
      full_name,
      email,
      contact_no,
      city_id,
      uuid: db.raw("UUID()"),
    });

    await trx.commit();
    return { message: "Loan submitted successfully" };
  } catch (err) {
    await trx.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { carLoan };
