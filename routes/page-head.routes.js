const express = require("express");
const router = express.Router();
const pageHeadController = require("../controllers/page-head.controller");

router.post("/", pageHeadController.pageHead);

module.exports = router;