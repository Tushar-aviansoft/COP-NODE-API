const express = require("express");
const router = express.Router();
const tollTaxController = require("../controllers/toll-tax.controller");
const validateBody = require("../middlewares/validate-body");
const { tollTaxPayloadSchema } = require("../validations/toll-tax-payload.validation");
const authenticateJWT = require("../middlewares/jwt");

router.post("/:page_name", validateBody(tollTaxPayloadSchema), authenticateJWT(true), tollTaxController.tollTaxResponse);


module.exports = router;
