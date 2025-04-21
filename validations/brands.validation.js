const Joi = require("joi");

const brandSchema = Joi.object({
  models: Joi.boolean().optional(),
  carTypes: Joi.boolean().optional(),
});

module.exports = {
  brandSchema,
};
