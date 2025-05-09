const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const imagePath = require("../config/image-path");
const { Features } = require("../config/constant");
const {wishListVariantSubQuery} = require("../config/helper");


const emiVariantDetail = async (brand, model, variant, city, auth) => {
    try {
        const data = await db("cop_variants")
            .select(
                db.raw("CONCAT(brand_name,' ',model_name,' ',variant_name) as name"),
                "cop_pe_ms.ex_showroom_price",
                db.raw(
                    `CONCAT(?,cop_brands_ms.brand_id,'/',cop_models.model_id,'/',cop_variants.variant_id,'/',cop_variants.variant_image) as variant_image`,
                    [imagePath.brand]
                ),
                db.raw(`CONCAT(cop_fv.feature_value,' ',cop_su_ms.su_name) as feature_value`),
                'cop_variants.seating_capacity',
                db.raw(`CONCAT(cop_brands_ms.slug,'-cars/',cop_models.slug,'/',cop_variants.slug) as slug`),
                'cop_variants.full_slug',
                db.raw(`${wishListVariantSubQuery(auth)} as wishlist`)
            )
            .innerJoin('cop_pe_ms', 'cop_pe_ms.variant_id', 'cop_variants.variant_id')
            .innerJoin('cop_fv', 'cop_fv.variant_id', 'cop_variants.variant_id')
            .innerJoin('cop_features_ms', 'cop_features_ms.feature_id', 'cop_fv.feature_id')
            .leftJoin('cop_su_ms', 'cop_su_ms.su_id', 'cop_features_ms.su_id')
            .innerJoin('cop_models', 'cop_models.model_id', 'cop_variants.model_id')
            .innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_models.brand_id')
            .where(db.raw(`CONCAT(cop_brands_ms.slug,'-cars')`), brand)
            .andWhere('cop_models.slug', model)
            .andWhere('cop_variants.slug', variant)
            .andWhere('cop_pe_ms.city_id', city)
            .whereIn('cop_features_ms.features_name', [Features.batteryCapacity, Features.displacement])
            .first();

        return data || [];
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
}

module.exports = {
    emiVariantDetail
}