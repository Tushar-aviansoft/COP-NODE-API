const express = require("express");
const router = express.Router();
const dealershipController = require("../controllers/dealership.controller");

router.get("/brands", dealershipController.brands);
router.get("/", dealershipController.dealerships);

module.exports = router;
