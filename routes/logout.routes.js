const express = require("express");
const router = express.Router();
const logOutController = require("../controllers/logout.controller");
const authenticateJWT = require("../middlewares/jwt");

router.post("/", authenticateJWT(true), logOutController.logOut);

module.exports = router;
