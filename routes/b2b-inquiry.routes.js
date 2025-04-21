const express = require("express");
const router = express.Router();
const b2bInquiryController = require("../controllers/b2b-inquiry.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateBody = require("../middlewares/validate-body");
const { b2bInquirySchema } = require("../validations/b2b-inquiry.validation");

router.post(
  "/",
  validateBody(b2bInquirySchema),
  b2bInquiryController.b2bInquiry
);

module.exports = router;
