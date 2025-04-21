const express = require("express");
const router = express.Router();
const compareCarsController = require("../controllers/compare-cars.controller");
const validateCity = require("../middlewares/city");

router.get("/:slug", validateCity(true), compareCarsController.compare);

module.exports = router;
