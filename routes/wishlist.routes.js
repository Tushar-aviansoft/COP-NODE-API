const express = require("express");
const router = express.Router();
const wishListController = require("../controllers/wishlist.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateCity = require("../middlewares/city");

router.get(
  "/",
  validateCity(true),
  authenticateJWT(true),
  wishListController.userWishList
);
router.post(
  "/:brand/:model/:variant?",
  validateCity(true),
  authenticateJWT(true),
  wishListController.wishList
);

module.exports = router;
