const express = require("express");
const router = express.Router();
const mailVerifyController = require("../controllers/mail-verify.controller");
const validateBody = require("../middlewares/validate-body");
const { sendOTPSchema, verifyOTPSchema } = require("../validations/book-test-drive.validation");

router.post("/send-otp", validateBody(sendOTPSchema), mailVerifyController.sendOtp);
router.post("/verify-otp", validateBody(verifyOTPSchema), mailVerifyController.verifyOtp);
module.exports = router;
