const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");

const deleteAccount = async (auth) => {
  const trx = await db.transaction();
  try {
    const customerDataDelete = await db("cop_customers")
      .where("customer_id", auth)
      .first();

    if (!customerDataDelete) {
      await trx.rollback();
      throw new ApiError(httpStatus.NOT_FOUND, "Customer not found!");
    }
    const detailsArray = {
      contact_no: customerDataDelete.contact_no,
      email: customerDataDelete.email,
    };

    await db("cop_archive").insert({
      customer_id: customerDataDelete.customer_id,
      detail: JSON.stringify(detailsArray),
      uuid: db.raw("UUID()"),
    });

    await db("cop_customers").where("customer_id", auth).update({
      contact_no: null,
      email: null,
      status: 0,
    });
    await trx.commit();

    return { message: "User account deleted successfully." };
  } catch (err) {
    await trx.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { deleteAccount };
