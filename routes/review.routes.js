const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const {
  ratingAndReviewsSchema,
  createReviewSchema,
  likeReviewSchema,
} = require("../validations/rating-reviews.validation");
const authenticateJWT = require("../middlewares/jwt");
const validateQuery = require("../middlewares/validate-query");
const validateBody = require("../middlewares/validate-body");

router
  .get(
    "/:brand/:model",
    validateQuery(ratingAndReviewsSchema),
    authenticateJWT(false),
    reviewController.ratingAndReviews
  )
  .post(
    "/:brand/:model",
    authenticateJWT(true),
    validateBody(createReviewSchema),
    reviewController.createReview
  )
  .put(
    "/:brand/:model",
    authenticateJWT(true),
    validateBody(likeReviewSchema),
    reviewController.likeReview
  );

module.exports = router;
