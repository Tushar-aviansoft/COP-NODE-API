const express = require("express");
const router = express.Router();
const cityController = require("../controllers/city.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateCity = require("../middlewares/city");

router.get("/", cityController.cityData);
router.get("/all", cityController.allCities);
router.post(
  "/",
  authenticateJWT(true),
  validateCity(true),
  cityController.saveCity
);

module.exports = router;
