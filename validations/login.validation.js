const Joi = require("joi");

const loginSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number cannot be empty.",
      "string.pattern.base": "Mobile number must be 10 digits.",
      "any.required": `Mobile number is a required field`,
    }),
});

module.exports = {
  loginSchema,
};
