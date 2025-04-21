const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home-page.controller");
const validateCity = require("../middlewares/city");
const authenticateJWT = require("../middlewares/jwt");

router.get("/head-banners", homeController.headBanners);
router.get("/ev-banners", validateCity(false), homeController.evBanners);
router.get("/upcoming-banners", homeController.upComingBanners);

router.get("/car-types", homeController.carTypes);

router.get(
  "/popular-cars",
  validateCity(false),
  authenticateJWT(false),
  homeController.popularCars
);

router.get(
  "/upcoming-cars", 
  validateCity(false),
  authenticateJWT(false),
  homeController.newLaunchedCars
);

router.get(
  "/ev-cars",
  validateCity(false),
  authenticateJWT(false),
  homeController.evCars
);

router.get(
  "/cars-by-budget",
  validateCity(false),
  authenticateJWT(false),
  homeController.carsByBudget
);

module.exports = router;
