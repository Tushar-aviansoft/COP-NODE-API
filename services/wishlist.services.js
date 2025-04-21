const { Features } = require("../config/constant");
const db = require("../config/database");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const wishList = async (auth, brand, model, variant, city) => {
  const query = db("cop_wl")
    .select("wl_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_wl.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("customer_id", auth)
    .andWhere("cop_models.slug", model)
    .modify((qb) => {
      if (variant) {
        qb.innerJoin(
          "cop_variants",
          "cop_variants.variant_id",
          "cop_wl.variant_id"
        ).andWhere("cop_variants.slug", variant);
      } else {
        qb.innerJoin(
          "base_variant_id",
          "base_variant_id.model_id",
          "cop_wl.model_id"
        );
      }
    })
    .first();
  try {
    const result = await query;
    if (result && result["wl_id"]) {
      await db("cop_wl").where({ wl_id: result["wl_id"] }).del();
      return { result: "removed" };
    } else {
      const addWishList = await db("cop_models")
        .select("cop_models.model_id", "variant_id")
        .innerJoin(
          "cop_brands_ms",
          "cop_brands_ms.brand_id",
          "cop_models.brand_id"
        )
        .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
        .andWhere("cop_models.slug", model)
        .first()
        .modify((qb) => {
          if (variant) {
            qb.innerJoin(
              "cop_variants",
              "cop_variants.model_id",
              "cop_models.model_id"
            ).andWhere("cop_variants.slug", variant);
          } else {
            qb.innerJoin(
              "base_variant_id",
              "base_variant_id.model_id",
              "cop_models.model_id"
            );
          }
        });
      const insert = db("cop_wl").insert({
        model_id: addWishList["model_id"],
        variant_id: addWishList["variant_id"],
        uuid: db.raw("UUID()"),
        customer_id: auth,
        created_date: db.raw("CURRENT_TIMESTAMP"),
      });

      const data = db("cop_variants")
        .select(
          db.raw(
            `CONCAT(cop_brands_ms.brand_name," ", cop_models.model_name," ",cop_variants.variant_name) as name`
          ),
          db.raw(
            `CONCAT("/",cop_brands_ms.slug,"-cars/", cop_models.slug,"/",cop_variants.slug) as slug`
          ),
          db.raw(
            `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
            [imagePath.brand]
          ),
          "cop_models.image_alt",
          "cop_models.image_title",
          "seating_capacity",
          db.raw(
            `(SELECT DISTINCT CONCAT(MIN(CAST(cop_fv.feature_value AS SIGNED)), " ", cop_su_ms.su_name)
          FROM cop_fv
          INNER JOIN cop_features_ms ON cop_features_ms.feature_id = cop_fv.feature_id
          LEFT JOIN cop_su_ms ON cop_su_ms.su_id = cop_features_ms.su_id
          WHERE cop_fv.variant_id = cop_variants.variant_id
            AND (
              cop_features_ms.features_name = ?
              OR cop_features_ms.features_name = ?
            )
          GROUP BY cop_su_ms.su_name) AS feature_value`,
            [Features.displacement, Features.batteryCapacity]
          ),
          "ex_showroom_price"
        )
        .join("cop_models", "cop_models.model_id", "=", "cop_variants.model_id")
        .join(
          "cop_brands_ms",
          "cop_brands_ms.brand_id",
          "=",
          "cop_models.brand_id"
        )
        .join(
          "cop_pe_ms",
          "cop_pe_ms.variant_id",
          "=",
          "cop_variants.variant_id"
        )
        .andWhere("cop_pe_ms.city_id", city)
        .andWhere("cop_brands_ms.status", 1)
        .andWhere("cop_models.status", 1)
        .andWhere("cop_variants.status", 1)
        .andWhere("cop_variants.variant_id", addWishList["variant_id"])
        .first();
      const [insertWishlist, result] = await Promise.all([insert, data]);
      return { result };
    }
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const userWishlist = async (auth, city) => {
  const query = db("cop_wl")
    .select(
      db.raw(
        `CONCAT(cop_brands_ms.brand_name," ", cop_models.model_name," ",cop_variants.variant_name) as name`
      ),
      db.raw(
        `CONCAT("/",cop_brands_ms.slug,"-cars/", cop_models.slug,"/",cop_variants.slug) as slug`
      ),
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
        [imagePath.brand]
      ),
      "cop_models.image_alt",
      "cop_models.image_title",
      "seating_capacity",

      db.raw(
        `(SELECT DISTINCT CONCAT(MIN(CAST(cop_fv.feature_value AS SIGNED)), " ", cop_su_ms.su_name)
        FROM cop_fv
        INNER JOIN cop_features_ms ON cop_features_ms.feature_id = cop_fv.feature_id
        LEFT JOIN cop_su_ms ON cop_su_ms.su_id = cop_features_ms.su_id
        WHERE cop_fv.variant_id = cop_wl.variant_id
          AND (
            cop_features_ms.features_name = ?
            OR cop_features_ms.features_name = ?
          )
        GROUP BY cop_su_ms.su_name) AS feature_value`,
        [Features.displacement, Features.batteryCapacity]
      ),
      "ex_showroom_price"
    )
    .join("cop_variants", "cop_variants.variant_id", "=", "cop_wl.variant_id")
    .join("cop_models", "cop_models.model_id", "=", "cop_variants.model_id")

    .join("cop_brands_ms", "cop_brands_ms.brand_id", "=", "cop_models.brand_id")
    .join("cop_pe_ms", "cop_pe_ms.variant_id", "=", "cop_variants.variant_id")
    .where("cop_wl.customer_id", auth)
    .andWhere("cop_pe_ms.city_id", city)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1);
  try {
    const result = await query;

    return result;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = { wishList, userWishlist };
