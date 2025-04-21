const express = require("express");
const router = express.Router();
const exploreBrandController = require("../controllers/explore-brand.controller");
const validateQuery = require("../middlewares/validate-query");
const { brandSchema } = require("../validations/brands.validation");
const authenticateJWT = require("../middlewares/jwt");
const validateCity = require("../middlewares/city");

router.get("/", validateQuery(brandSchema), exploreBrandController.brands);
router.get(
  "/:slug",
  validateCity(false),
  authenticateJWT(false),
  exploreBrandController.models
);
router.get(
  "/:brand/similarModels",
  // validateCity(true),
  validateCity(false),
  exploreBrandController.similarModels
);
router.get(
  "/:brand/:model",
  // validateCity(true),
  validateCity(false),
  exploreBrandController.variants
);
router.get(
  "/:brand/:model/gallery", 
  exploreBrandController.gallery
);
router.get(
  "/:brand/:model/set-price-alert",
  authenticateJWT(true),
  exploreBrandController.setPriceAlert
); // don't change the possition of this route (always put this as above the "/:brand/:model/:variant")




router.get(
  "/:brand/:model/modelDesc",
  // validateCity(true),
  validateCity(false),
  exploreBrandController.modelDescription
);


router.get(
  "/:brand/:model/:variant",
  // validateCity(true),
  validateCity(false),
  authenticateJWT(false),
  exploreBrandController.variantDetail
);
router.get(
  "/:brand/:model/:variant/colors",
  exploreBrandController.variantColors
);
router.get(
  "/:brand/:model/:variant/price",
  // validateCity(true),
  validateCity(false),
  authenticateJWT(false),
  exploreBrandController.variantPrice
);
router.get(
  "/:brand/:model/:variant/specifications",
  exploreBrandController.variantSpecifications
);
router.get(
  "/:brand/:model/:variant/key-highlights",
  exploreBrandController.variantKeyHighlights
);
router.get(
  "/:brand/:model/:variant/description",
  // validateCity(true),
  validateCity(false),
  exploreBrandController.variantDescription
);
router.get(
  "/:brand/:model/:variant/faq",
  // validateCity(true),
  validateCity(false),
  exploreBrandController.variantFaq
);




module.exports = router;
