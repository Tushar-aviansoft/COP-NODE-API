const express = require("express");
const router = express.Router();
const evChargingStationController = require("../controllers/ev-charging-station.controller");

router.get("/cities", evChargingStationController.cities);
router.get("/", evChargingStationController.evStations);

module.exports = router;