const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");


const siteMap = async (model, variant) => {
    try {
        const result = {};


        if (model) {
            const models = await db("cop_brands_ms")
                .innerJoin("cop_models", "cop_brands_ms.brand_id", "cop_models.brand_id")
                .select(
                    db.raw(`CONCAT('/' ,cop_brands_ms.slug, '-cars/', cop_models.slug) AS slug`)
                );

            result.models = models;
        }

        if (variant) {
            const variants = await db("cop_brands_ms")
                .innerJoin("cop_models", "cop_brands_ms.brand_id", "cop_models.brand_id")
                .innerJoin("cop_variants", "cop_models.model_id", "cop_variants.model_id")
                .select(
                    db.raw(`CONCAT('/', cop_brands_ms.slug, '-cars/', cop_models.slug, '/' , cop_variants.slug ) AS slug`)
                );
            result.variants = variants;
        }

        return result;

    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
};


module.exports = {
    siteMap
}