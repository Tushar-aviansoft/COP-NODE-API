const express = require("express");
const router = express.Router();
const evCarsController = require("../controllers/ev-cars.controller");
const validateCity = require("../middlewares/city");
const authenticateJWT = require("../middlewares/jwt");

router.get("/brands", evCarsController.brands);
router.get(
  "/",
  validateCity(true),
  authenticateJWT(false),
  evCarsController.models
);

module.exports = router;
