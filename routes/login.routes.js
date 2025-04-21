const express = require("express");
const router = express.Router();
const loginController = require("../controllers/login.controller");

router.post("/send-otp", loginController.sendOtp);
router.post("/verify-otp", loginController.verifyOtp);
router.post("/resend-otp", loginController.resendOtp);

module.exports = router;
