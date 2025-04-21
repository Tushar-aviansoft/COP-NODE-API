const httpStatus = require("http-status");
const reviewService = require("../services/review.services");
const ratingAndReviews = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const { limit } = req.query;
    const auth = req.auth ?? null;

    const data = await reviewService.ratingAndReviews(
      brand,
      model,
      limit,
      auth
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const createReview = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const { rating, review } = req.body;
    const auth = req.auth;

    const data = await reviewService.createReview(
      brand,
      model,
      rating,
      review,
      auth
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const likeReview = async (req, res, next) => {
  try {
    // const { brand, model } = req.params;
    const { id } = req.body;
    const auth = req.auth;

    const data = await reviewService.likeReview(id, auth);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, likeReview, ratingAndReviews };
