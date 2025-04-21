const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const db = require("../config/database");

const authenticateJWT =
  (isRequired = true) =>
  async (req, res, next) => {
    try {
      const token =
        req.cookies.jwt || req.header("Authorization")?.split(" ")[1];
      if (!token) {
        if (isRequired) {
          return next(
            new ApiError(
              httpStatus.UNAUTHORIZED,
              "Access denied. No token provided."
            )
          );
        }
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const auth = await db("cop_customers")
        .where("uuid", decoded.uuid)
        .select("customer_id")
        .first();
      if (!auth) {
        if (isRequired) {
          return next(
            new ApiError(httpStatus.NOT_FOUND, "Customer not found.")
          );
        }
        req.auth = null;
        return next();
      }
      req.auth = auth.customer_id;
      next();
    } catch (err) {
      if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
      ) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token.")
        );
      }
      next(err);
    }
  };

module.exports = authenticateJWT;
