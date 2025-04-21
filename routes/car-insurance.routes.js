const express = require("express");
const router = express.Router();
const carInsuranceController = require("../controllers/car-insurance.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateBody = require("../middlewares/validate-body");
const {
  carInsuranceSchema,
} = require("../validations/car-insurance.validation");

router.post(
  "/",
  authenticateJWT(true),
  validateBody(carInsuranceSchema),
  carInsuranceController.carInsurance
);

module.exports = router;
