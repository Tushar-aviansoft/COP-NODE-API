const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const imagePath = require("../config/image-path");
const { variantFeatures } = require("../config/constant");
const { applyFuelModelLogic } = require("../config/helper");

const compare = async (cityId, slug) => {
  if (!slug) {
    throw new ApiError(httpStatus.PRECONDITION_REQUIRED, "slug are required");
  }
  const variantFullSlug = slug.split("-and-");
  const detailQuery = db
    .select(
      "cop_brands_ms.brand_name",
      "cop_models.model_name",
      "cop_variants.variant_name",
      "cop_variants.full_slug",
      "cop_models.image_alt",
      "cop_models.image_title",
      db.raw("GROUP_CONCAT(IF(dual_color_code IS NULL OR dual_color_code = '', CONCAT(color_code, '-NULL'), CONCAT(color_code, '-', dual_color_code))) AS colors"),
      db.raw(
        'CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug,"/",cop_variants.slug) AS slug'
      ),
      db.raw(
        "CASE WHEN MAX(cop_pe_ms.ex_showroom_price) IS NULL THEN 0 ELSE MAX(cop_pe_ms.ex_showroom_price) END as ex_showroom_price"
      ),
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
        [imagePath.brand]
      )
    )
    .from("cop_variants")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .leftJoin("cop_colors", "cop_colors.variant_id", "cop_variants.variant_id")
    .leftJoin("cop_pe_ms", "cop_pe_ms.variant_id", "cop_variants.variant_id")
    .whereIn("cop_variants.full_slug", variantFullSlug)
    .where("cop_pe_ms.city_id", cityId)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .groupBy("cop_variants.variant_id")
    .orderByRaw(
      `FIELD(cop_variants.full_slug, ${variantFullSlug
        .map((slug) => `'${slug}'`)
        .join(", ")})`
    );
  const specQuery = db
    .select(
      "model_type",
      db.raw(`(SELECT Concat('[',Group_concat(Json_object('sc_name',spec.sc_name, 'spec_data',
                (SELECT Concat('[',Group_concat(Json_object('spec_name',sm.spec_name, 'spec_image',CONCAT('${imagePath.specification}', sm.spec_id, '/', sm.spec_image) , 'spec_id',sm.spec_id, 'features_name',
                (SELECT Concat('[',Group_concat(Json_object('features_name',fm.features_name, 'fuel_type',fuel_type,'feature_value',
                (SELECT   
                            CONCAT(fv.feature_value, ' ', IFNULL(su.su_name, ''))
                     FROM cop_fv fv LEFT JOIN cop_su_ms su ON fm.su_id = su.su_id WHERE fm.feature_id = fv.feature_id AND fv.variant_id = v.variant_id ) )),']')
                FROM cop_features_ms fm WHERE sm.spec_id = fm.spec_id ) )),']')
                FROM cop_spec_ms sm WHERE sm.sc_id = spec.sc_id ) )),']')
                FROM cop_sc_ms spec) AS sc_data`)
    )
    .from("cop_variants as v")
    .innerJoin("cop_models", "cop_models.model_id", "v.model_id")
    .andWhere("cop_models.status", 1)
    .andWhere("v.status", 1)
    .whereIn("v.full_slug", variantFullSlug)
    .groupBy("v.variant_id")
    .orderByRaw(
      `FIELD(v.full_slug, ${variantFullSlug
        .map((slug) => `'${slug}'`)
        .join(", ")})`
    );
  try {
    const [variantDetail, variantSpec] = await Promise.all([
      detailQuery,
      specQuery,
    ]);

    const parsedData = variantSpec.map((item1) => {
      const scDataParsed = item1.sc_data ? JSON.parse(item1.sc_data) : [];

      const specData = scDataParsed.map((item2) => {
        const specDataParsed = item2.spec_data
          ? JSON.parse(item2.spec_data)
          : [];

        const featureName = specDataParsed.map((item3) => {
          const featureNameParsed = item3.features_name
            ? JSON.parse(item3.features_name)
            : [];

          const featureValue = featureNameParsed.map((item4) => {
            const fv_value = applyFuelModelLogic(
              item4.feature_value,
              item1.model_type,
              item4.fuel_type
            );
            return {
              ...item4,
              feature_value: fv_value,
            };
          });

          return {
            ...item3,
            features_name: featureValue,
          };
        });

        return {
          ...item2,
          spec_data: featureName,
        };
      });

      return {
        ...item1,
        sc_data: specData,
      };
    });
    const mergedData = [];
    const basicDetail = [];

    parsedData.forEach((variant) => {
      variant.sc_data.forEach((sc) => {
        const existingCategory = mergedData.find(
          (category) => category.sc_name === sc.sc_name
        );

        if (!existingCategory) {
          mergedData.push({
            sc_name: sc.sc_name,
            spec_data: sc.spec_data.map((spec) => ({
              spec_id: spec.spec_id,
              spec_name: spec.spec_name,
              spec_image: spec.spec_image,
              features_name: spec.features_name.map((feature) => ({
                features_name: feature.features_name,
                feature_value: [feature.feature_value],
              })),
            })),
          });
        } else {
          sc.spec_data.forEach((spec) => {
            const existingSpec = existingCategory.spec_data.find(
              (existingSpec) => existingSpec.spec_id === spec.spec_id
            );

            if (existingSpec) {
              spec.features_name.forEach((newFeature) => {
                const existingFeature = existingSpec.features_name.find(
                  (existingFeature) =>
                    existingFeature.features_name === newFeature.features_name
                );

                if (existingFeature) {
                  existingFeature.feature_value.push(newFeature.feature_value);
                } else {
                  existingSpec.features_name.push({
                    features_name: newFeature.features_name,
                    feature_value: [newFeature.feature_value],
                  });
                }
              });
            } else {
              existingCategory.spec_data.push({
                spec_id: spec.spec_id,
                spec_name: spec.spec_name,
                spec_image: spec.spec_image,
                features_name: spec.features_name.map((feature) => ({
                  features_name: feature.features_name,
                  feature_value: [feature.feature_value],
                })),
              });
            }
          });
        }
      });
    });

    mergedData.map((spec) => {
      spec.spec_data.forEach((specItem) => {
        specItem.features_name = specItem.features_name.filter((feature) =>
          feature.feature_value.some((value) => value !== null)
        );
        specItem.features_name = specItem.features_name.map((feature) => {
          feature.feature_value = feature.feature_value.map((value) => {
            return value === null ? "No" : value;
          });
          return feature;
        });
        const filteredFeatures = specItem.features_name.filter((feature) =>
          variantFeatures.includes(feature.features_name)
        );
        basicDetail.push(...filteredFeatures);
      });
    });

    return {
      variants: variantDetail,
      specs: mergedData,
      basicDetail: basicDetail,
    };
  } catch (err) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch data of compare cars"
    );
  }
};

module.exports = {
  compare,
};
