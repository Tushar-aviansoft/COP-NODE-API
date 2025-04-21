const express = require("express");
const router = express.Router();
const carLoanController = require("../controllers/car-loan.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateBody = require("../middlewares/validate-body");
const { carLoanSchema } = require("../validations/car-loan.validation");

router.post(
  "/",
  authenticateJWT(true),
  validateBody(carLoanSchema),
  carLoanController.carLoan
);

module.exports = router;
