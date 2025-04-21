const express = require("express");
const router = express.Router();
const upcomingCarsController = require("../controllers/upcoming-cars.controller");

router.get("/models", upcomingCarsController.models);
router.get("/launch-months", upcomingCarsController.launchMonth);
router.get("/budget", upcomingCarsController.budget);
router.get("/brands", upcomingCarsController.brands);
router.get("/car-types", upcomingCarsController.carTypes);

module.exports = router;
