const express = require("express");
const router = express.Router();
const emiCalculatorController = require("../controllers/emi-calculator.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateCity = require("../middlewares/city");

router.get("/:brand/:model/:variant", validateCity(true), authenticateJWT(false), emiCalculatorController.emiVariantDetail);

module.exports = router;