const Joi = require("joi");

const testDriveSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
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
  address: Joi.string().required().messages({
    "string.empty": `Address cannot be empty`,
    "any.required": `Address is a required field`,
  }),
  location: Joi.string().required().messages({
    "string.empty": `Location cannot be empty`,
    "any.required": `Location is a required field`,
  }),
  fuel: Joi.string().required().messages({
    "string.empty": `Fuel cannot be empty`,
    "any.required": `Fuel is a required field`,
  }),
  transmission: Joi.string().required().messages({
    "string.empty": `Transmission cannot be empty`,
    "any.required": `Transmission is a required field`,
  }),
  estimated_purchase_date: Joi.string().required().messages({
    "string.empty": `Estimated purchase date cannot be empty`,
    "any.required": `Estimated purchase date is a required field`,
  }),
  dealer: Joi.string()
    .uuid({ version: "uuidv1", separator: "-" })
    .optional()
    .messages({
      "string.guid": `Dealer must be a valid UUID`,
    }),
});

const sendOTPSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    "string.email": `Email must be a valid email address`,
    "string.empty": `Email cannot be empty`,
    "any.required": `Email is a required field`,
  }),
});

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    "string.email": `Email must be a valid email address`,
    "string.empty": `Email cannot be empty`,
    "any.required": `Email is a required field`,
  }),
  otp: Joi.number().integer().min(100000).max(999999).required().messages({
    "number.base": "OTP must be a number",
    "number.integer": "OTP must be an integer",
    "number.min": "OTP must be a 6-digit number",
    "number.max": "OTP must be a 6-digit number",
    "any.required": "OTP is a required field",
  }),
});

module.exports = { testDriveSchema, sendOTPSchema, verifyOTPSchema };
