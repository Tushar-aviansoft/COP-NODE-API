const express = require("express");
const router = express.Router();
const newlyLaunchedCarsController = require("../controllers/newly-launched-cars.controller");
const validateCity = require("../middlewares/city");
const authenticateJWT = require("../middlewares/jwt");

router.get(
  "/models",
  validateCity(false),
  authenticateJWT(false),
  newlyLaunchedCarsController.models
);
router.get("/launch-months", newlyLaunchedCarsController.launchMonth);
router.get("/budget", newlyLaunchedCarsController.budget);
router.get("/brands", newlyLaunchedCarsController.brands);
router.get("/car-types", newlyLaunchedCarsController.carTypes);

module.exports = router;
