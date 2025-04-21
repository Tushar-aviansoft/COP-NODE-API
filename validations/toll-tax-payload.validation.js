const Joi = require("joi");

const tollTaxPayloadSchema = Joi.object({
    from_address: Joi.string().required().messages({
        "any.required": "from_address is required",
    }),
    from_latitude: Joi.string().required().messages({
        "any.required": "from_latitude is required",
    }),
    from_longitude: Joi.string().required().messages({
        "any.required": "from_longitude is required",
    }),
    from_city_name: Joi.string().required().messages({
        "any.required": "from_city_name is required",
    }),
    from_country: Joi.string().required().messages({
        "any.required": "from_country is required",
    }),
    from_state_code: Joi.string().required().messages({
        "any.required": "from_state_code is required",
    }),
    from_state_name: Joi.string().required().messages({
        "any.required": "from_state_name is required",
    }),
    from_uri: Joi.string().required().messages({
        "any.required": "from_uri is required",
    }),
    to_address: Joi.string().required().messages({
        "any.required": "to_address is required",
    }),
    to_latitude: Joi.string().required().messages({
        "any.required": "to_latitude is required",
    }),
    to_longitude: Joi.string().required().messages({
        "any.required": "to_longitude is required",
    }),
    to_city_name: Joi.string().required().messages({
        "any.required": "to_city_name is required",
    }),
    to_country: Joi.string().required().messages({
        "any.required": "to_country is required",
    }),
    to_state_code: Joi.string().required().messages({
        "any.required": "to_state_code is required",
    }),
    to_state_name: Joi.string().required().messages({
        "any.required": "to_state_name is required",
    }),
    to_uri: Joi.string().required().messages({
        "any.required": "to_uri is required",
    }),
});

module.exports = {
    tollTaxPayloadSchema,
};
