const db = require("../config/database");
const httpStatus = require("http-status");
const { seoPages, seoPagesArray, seoType } = require("../config/constant");
const ApiError = require("../utils/ApiError");


const seoMetaData = async (brand, model, variant, page_name_slug) => {

    if (!seoPagesArray.includes(page_name_slug)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Page not found");
    }

    const seoDataGet = db('cop_seo_ms')
        .select('cop_seo_meta_tags_ms.meta_tag_name','cop_seo_ms.tag_content')
        .innerJoin('cop_seo_pages_ms', 'cop_seo_pages_ms.page_id', 'cop_seo_ms.page_id')
        .innerJoin('cop_seo_meta_tags_ms', 'cop_seo_meta_tags_ms.meta_tag_id', 'cop_seo_ms.meta_tag_id')
        .where('cop_seo_pages_ms.page_slug', page_name_slug)
        .andWhere('cop_seo_pages_ms.status', 1)
        .andWhere('cop_seo_ms.status', 1)
        .andWhere('cop_seo_meta_tags_ms.status', 1);

    if (!brand && !model && !variant) {
        seoDataGet.whereNull('cop_seo_ms.brand_id')
            .andWhere('cop_seo_ms.seo_type', seoType.pageType);
    }
    if (brand && !model && !variant) {
        seoDataGet.innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_seo_ms.brand_id')
            .andWhere('cop_brands_ms.slug', brand)
            .andWhere('cop_seo_ms.seo_type', seoType.brandType);
    }
    if (brand && model && !variant) {
        seoDataGet.innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_seo_ms.brand_id')
            .innerJoin('cop_models', 'cop_models.model_id', 'cop_seo_ms.model_id')
            .andWhere('cop_brands_ms.slug', brand)
            .andWhere('cop_models.slug', model)
            .andWhere('cop_seo_ms.seo_type', seoType.modelType);
    }
    if (brand && model && variant) {
        seoDataGet.innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_seo_ms.brand_id')
            .innerJoin('cop_models', 'cop_models.model_id', 'cop_seo_ms.model_id')
            .innerJoin('cop_variants', 'cop_variants.variant_id', 'cop_seo_ms.variant_id')
            .andWhere('cop_brands_ms.slug', brand)
            .andWhere('cop_models.slug', model)
            .andWhere('cop_variants.slug', variant)
            .andWhere('cop_seo_ms.seo_type', seoType.variantType);
    }

    try {
        const seoData = await seoDataGet;

        return seoData;
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
}

module.exports = {
    seoMetaData,
}
