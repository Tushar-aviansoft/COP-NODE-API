const express = require("express");
const router = express.Router();
const siteMapController = require("../controllers/sitemap.controller");


router.get("/", siteMapController.siteMapData);

module.exports = router;    