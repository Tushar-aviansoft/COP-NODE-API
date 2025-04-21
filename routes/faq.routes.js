const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faq.controller");
const validateCity = require("../middlewares/city");

router.get("/:brand/:model/:variant", validateCity(false), faqController.faq);

module.exports = router;
