const express = require("express");
const router = express.Router();
const fuelStationController = require("../controllers/fuel-station.controller");

router.get("/cities", fuelStationController.cities);
router.get("/", fuelStationController.fuelStations);

module.exports = router;