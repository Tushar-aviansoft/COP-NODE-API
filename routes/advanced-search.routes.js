const express = require("express");
const router = express.Router();
const advancedSearchController = require("../controllers/advanced-search.controller");
const validateCity = require("../middlewares/city");
const authenticateJWT = require("../middlewares/jwt");

router.get(
  "/models",
  validateCity(false),
  authenticateJWT(false),
  advancedSearchController.models
);
router.get("/budget", advancedSearchController.budget);
router.get("/brands", advancedSearchController.brands);
router.get("/car-types", advancedSearchController.carTypes);
router.get("/fuel-types", advancedSearchController.fuelTypes);
router.get("/engine", advancedSearchController.engine);
router.get("/transmission", advancedSearchController.transmission);
router.get("/drive-train", advancedSearchController.driveTrain);
router.get("/safety", advancedSearchController.safety);
router.get("/interior", advancedSearchController.interior);
router.get("/exterior", advancedSearchController.exterior);
router.get(
  "/variants/:brand/:model",
  validateCity(false),
  advancedSearchController.variants
);

module.exports = router;
