const Joi = require("joi");

const b2bInquirySchema = Joi.object({
  full_name: Joi.string().min(3).max(100).required().messages({
    "string.base": `Name should be a type of 'text'`,
    "string.empty": `Name cannot be empty`,
    "string.min": `Name should have a minimum length of 3`,
    "string.max": `Name should have a maximum length of 100`,
    "any.required": `Name is a required field`,
  }),
  email: Joi.string().email().required().messages({
    "string.email": `Email must be a valid email address`,
    "string.empty": `Email cannot be empty`,
    "any.required": `Email is a required field`,
  }),
  contact_no: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.empty": "Contact No. is required.",
      "string.pattern.base": "Contact No. must be 10 digits.",
      "any.required": `Contact No is a required field`,
    }),
  dealer_name: Joi.string().min(3).max(100).required().messages({
    "string.base": `Dealer Name should be a type of 'text'`,
    "string.empty": `Dealer Name cannot be empty`,
    "string.min": `Dealer Name should have a minimum length of 3`,
    "string.max": `Dealer Name should have a maximum length of 100`,
    "any.required": `Dealer Name is a required field`,
  }),
  dealer_address: Joi.string().required().messages({
    "string.base": `Dealer Address should be a type of 'text'`,
    "string.empty": `Dealer Address cannot be empty`,
    "any.required": `Dealer Address is a required field`,
  }),
});

module.exports = {
  b2bInquirySchema,
};
