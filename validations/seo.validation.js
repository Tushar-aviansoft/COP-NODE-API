const Joi = require("joi");

const seoSchema = Joi.object({
    page_name_slug: Joi.string().required(),
    brand: Joi.string().optional(),
    model: Joi.string().optional(),
    variant: Joi.string().optional(),
});

module.exports = {
    seoSchema
}