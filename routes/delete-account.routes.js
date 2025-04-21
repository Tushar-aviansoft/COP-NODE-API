const express = require("express");
const router = express.Router();
const deleteAccountController = require("../controllers/delete-account.controller");
const authenticateJWT = require("../middlewares/jwt");

router.delete(
  "/",
  authenticateJWT(true),
  deleteAccountController.deleteAccount
);

module.exports = router;
