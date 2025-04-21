const Joi = require("joi");

const ratingAndReviewsSchema = Joi.object({
  limit: Joi.number().integer().positive().optional(),
});

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().positive().required(),
  review: Joi.string().optional(),
});
const likeReviewSchema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv1", separator: "-" }).required(),
});
module.exports = {
  ratingAndReviewsSchema,
  createReviewSchema,
  likeReviewSchema,
};
