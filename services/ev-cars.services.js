const db = require("../config/database");
const { ModelType, CarStages } = require("../config/constant");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const { wishListModelSubQuery } = require("../config/helper");

const brands = async () => {
  const query = db
    .select("cop_brands_ms.uuid as id", "cop_brands_ms.brand_name")
    .from("cop_brands_ms")
    .innerJoin("cop_models", "cop_models.brand_id", "cop_brands_ms.brand_id")
    .innerJoin("cop_cs_ms", "cop_cs_ms.cs_id", "cop_models.cs_id")
    .where("cop_models.model_type", ModelType.ev)
    .andWhere("cop_cs_ms.cs_name", CarStages.launched)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_brands_ms.status", 1)
    .groupBy(
      "cop_brands_ms.uuid",
      "cop_brands_ms.brand_name",
      "cop_brands_ms.priority"
    )
    .orderBy("cop_brands_ms.priority", "asc");

  try {
    const data = await query;

    return data;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const models = async (minPrice, maxPrice, brand, cityId, auth) => {
  if ((!minPrice || !maxPrice) && !brand) {
    throw new ApiError(
      httpStatus.PRECONDITION_REQUIRED,
      "minPrice & maxPrice OR brand any one is required"
    );
  }
  let query = db
    .select(
      db.raw(
        "CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name) AS name"
      ),
      db.raw('CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug) AS slug'),
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/thumb/' , cop_models.model_image) as model_image`,
        [imagePath.brand]
      ),
      "cop_models.image_alt",
      "cop_models.image_title",
      "min_price_data.min_price",
      "max_price_data.max_price",
      "base_feature.feature_json",
      db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
    )
    .from("cop_models")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .innerJoin("cop_cs_ms", "cop_cs_ms.cs_id", "cop_models.cs_id")
    .leftJoin(
      db("cop_pe_ms")
        .select("cop_variants.model_id")
        .min("ex_showroom_price as min_price")
        .join("cop_variants", "cop_pe_ms.variant_id", "cop_variants.variant_id")
        .where(cityId ? { city_id: cityId } : {})
        .andWhere("cop_variants.status", 1)
        .groupBy("cop_variants.model_id")
        .as("min_price_data"),
      "min_price_data.model_id",
      "cop_models.model_id"
    )
    .leftJoin(
      db("cop_pe_ms")
        .select("cop_variants.model_id")
        .max("ex_showroom_price as max_price")
        .join("cop_variants", "cop_pe_ms.variant_id", "cop_variants.variant_id")
        .where(cityId ? { city_id: cityId } : {})
        .andWhere("cop_variants.status", 1)
        .groupBy("cop_variants.model_id")
        .as("max_price_data"),
      "max_price_data.model_id",
      "cop_models.model_id"
    )
    .leftJoin(
      db
        .select(
          "cop_fv.model_id",
          db.raw(
            `GROUP_CONCAT(
                JSON_OBJECT(
                    'feature_value', CONCAT(cop_fv.feature_value, ' ', cop_su_ms.su_name),
                    'features_image', CONCAT(?, '/', cop_features_ms.feature_id, '/', cop_features_ms.features_image)
                )
                ORDER BY FIELD(cop_features_ms.features_name, 'Range', 'Power (EV)')
            ) AS feature_json`,
            [imagePath.feature]
          )
        )
        .from("cop_fv")
        .innerJoin(
          "base_variant_id",
          "base_variant_id.variant_id",
          "cop_fv.variant_id"
        )
        .innerJoin(
          "cop_features_ms",
          "cop_features_ms.feature_id",
          "cop_fv.feature_id"
        )
        .innerJoin("cop_su_ms", "cop_features_ms.su_id", "cop_su_ms.su_id")
        .whereIn("cop_features_ms.features_name", ["Range", "Power (EV)"])
        .groupBy("cop_fv.model_id")
        .as("base_feature"),
      "base_feature.model_id",
      "cop_models.model_id"
    );

  if (minPrice != null && maxPrice != null) {
    query = query
      .innerJoin("cop_pe_ms", "cop_pe_ms.model_id", "cop_models.model_id")
      .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice])
      .andWhere("cop_pe_ms.status", 1);

    if (cityId) {
      query.andWhere("cop_pe_ms.city_id", cityId);
    }
  }

  if (brand != null) {
    query.where("cop_brands_ms.uuid", brand);
  }

  query
    .where("cop_models.model_type", ModelType.ev)
    .andWhere("cop_cs_ms.cs_name", CarStages.launched)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .distinct();

  try {
    const queryData = await query;
    const data = queryData.map((value) => {
      const parsedFeatureJson = value.feature_json
        ? JSON.parse(`[${value.feature_json}]`)
        : [];

      return {
        ...value,
        feature_json: parsedFeatureJson,
      };
    });

    return data;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = {
  models,
  brands,
};
