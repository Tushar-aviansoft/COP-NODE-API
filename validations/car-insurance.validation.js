const Joi = require("joi");

const carInsuranceSchema = Joi.object({
  brand: Joi.string()
    .uuid({ version: "uuidv1", separator: "-" })
    .required()
    .messages({
      "string.empty": `Brand cannot be empty`,
      "string.guid": `Brand must be a valid UUID`,
      "any.required": `Brand is a required field`,
    }),
  model: Joi.string()
    .uuid({ version: "uuidv1", separator: "-" })
    .required()
    .messages({
      "string.empty": `Model cannot be empty`,
      "string.guid": `Model must be a valid UUID`,
      "any.required": `Model is a required field`,
    }),
  full_name: Joi.string().min(3).max(100).required().messages({
    "string.base": `Name should be a type of 'text'`,
    "string.empty": `Name cannot be empty`,
    "string.min": `Name should have a minimum length of 3`,
    "string.max": `Name should have a maximum length of 100`,
    "any.required": `Name is a required field`,
  }),
  email: Joi.string().email().allow("").messages({
    "string.email": `Email must be a valid email address`,
  }),
  contact_no: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.empty": "Contact No. is required.",
      "string.pattern.base": "Contact No. must be 10 digits.",
      "any.required": `Contact No is a required field`,
    }),
  city: Joi.string()
    .uuid({ version: "uuidv1", separator: "-" })
    .required()
    .messages({
      "string.empty": `City cannot be empty`,
      "string.guid": `City must be a valid UUID`,
      "any.required": `City is a required field`,
    }),
});

module.exports = {
  carInsuranceSchema,
};
