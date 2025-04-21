const { City } = require("../config/constant");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const subscribe = async (email) => {
  try {
    console.log(email);
    const existingEmail = await db("cop_subscribe")
      .where("email", email)
      .first();

    if (existingEmail) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You've already subscribed for newsletters!"
      );
    }

    await db("cop_subscribe").insert({
      email,
      uuid: db.raw("UUID()"),
    });
    return { message: "Subscribed!" };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = { subscribe };
