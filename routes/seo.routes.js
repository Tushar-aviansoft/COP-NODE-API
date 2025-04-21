const express = require("express");
const router = express.Router();
const seoController = require("../controllers/seo.controller");
const { seoSchema } = require("../validations/seo.validation");
const validateBody = require("../middlewares/validate-body");

router.post("/meta-data", validateBody(seoSchema), seoController.seoMetaData);

module.exports = router;