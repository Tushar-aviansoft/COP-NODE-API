const Joi = require("joi");

const subscribeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Please provide your email.",
  }),
});

module.exports = {
  subscribeSchema,
};
