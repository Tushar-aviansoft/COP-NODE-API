const express = require("express");
const router = express.Router();
const warningLightsController = require("../controllers/warning-light.controller");

router.get("/", warningLightsController.warningLights);

module.exports = router;
