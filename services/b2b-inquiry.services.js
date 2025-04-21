const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const b2bInquiry = async (
  full_name,
  contact_no,
  email,
  dealer_name,
  dealer_address
) => {
  const trx = await db.transaction();
  try {
    await trx("b2b_dealer_inquiry").insert({
      full_name,
      contact_no,
      email,
      dealer_name,
      dealer_address,
      uuid: db.raw("UUID()"),
    });

    await trx.commit();
    return { message: "B2B inquiry submitted successfully" };
  } catch (err) {
    await trx.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { b2bInquiry };
