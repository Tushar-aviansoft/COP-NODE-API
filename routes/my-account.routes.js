const express = require("express");
const router = express.Router();
const myAccountController = require("../controllers/my-account.controller");
const authenticateJWT = require("../middlewares/jwt");

router.get("/", authenticateJWT(true), myAccountController.userDetail);
router.put(
  "/basic-detail",
  authenticateJWT(true),
  myAccountController.updateBasicDetail
);
router.put(
  "/address",
  authenticateJWT(true),
  myAccountController.updateAddress
);

router.put(
  "/profile-picture",
  authenticateJWT(true),
  myAccountController.updateProfile
);

module.exports = router;
