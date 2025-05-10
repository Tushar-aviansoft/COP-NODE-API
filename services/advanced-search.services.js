const {
  Features,
  Specification,
  Interior,
  Exterior,
  ModelType,
  CarStages,
  BudgetList,
} = require("../config/constant");
const db = require("../config/database");
const { wishListModelSubQuery } = require("../config/helper");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const models = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice,
  sort,
  cityId,
  page,
  limit,
  auth
) => {
  const offset = (page - 1) * limit;
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const modelQuery = db("cop_models")
    .select(
      db.raw("CONCAT(brand_name, ' ', cop_models.model_name) AS name"),
      db.raw('CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug) AS slug'),
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' , cop_models.model_image) as model_image`,
        [imagePath.brand]
      ),
      "cop_models.image_alt",
      "cop_models.image_title",
      "min_price_data.min_price",
      "max_price_data.max_price",
      db.raw(`
        COUNT(DISTINCT cop_variants.variant_id) AS variant_count
      `),
      "cop_models.model_id",
      db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
    )
    .join("cop_variants", "cop_models.model_id", "=", "cop_variants.model_id")
    .join("cop_brands_ms", "cop_brands_ms.brand_id", "=", "cop_models.brand_id")
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
    .join("cop_cs_ms", "cop_cs_ms.cs_id", "=", "cop_models.cs_id")
    .whereIn("cop_variants.variant_id", function () {
      this.select("cop_pe_ms.variant_id")
        .from("cop_pe_ms")
        .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
    })
    .where("cop_models.model_type", ModelType.nonEv)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .andWhere("cop_cs_ms.cs_name", CarStages.launched)
    // .distinct("cop_models.model_id")
    .groupBy("cop_models.model_id")
    .modify(function (queryBuilder) {
      if (sort == "DESC") {
        queryBuilder.orderBy("max_price", "DESC");
      } else {
        queryBuilder.orderBy("min_price", "ASC");
      }
      if (brands.length > 0) {
        queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
      }
      if (carTypes.length > 0) {
        queryBuilder.innerJoin(
          "cop_ct_ms",
          "cop_models.ct_id",
          "cop_ct_ms.ct_id"
        );
        queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
      }
      if (fuelTypes.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.from("cop_fv")
            .select("cop_fv.variant_id")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .whereIn("cop_fv.feature_value", fuelTypesArray)
            .where("cop_features_ms.features_name", Features.fuel);
        });
      }
      if (engine.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "=",
              "cop_fv.feature_id"
            );

          engineArray.forEach((range) => {
            const [minEngine, maxEngine] = range
              .split(" to ")
              .map((val) => parseInt(val.trim(), 10));
            this.orWhere(function () {
              this.where(
                "cop_features_ms.features_name",
                Features.displacement
              );
              this.andWhereBetween("cop_fv.feature_value", [
                minEngine,
                maxEngine,
              ]);
            });
          });
        });
      }
      if (driveTrain.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.from("cop_fv")
            .select("cop_fv.variant_id")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .whereIn("cop_fv.feature_value", driveTrainArray)
            .where("cop_features_ms.features_name", Features.driveTrain);
        });
      }
      if (transmission.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.from("cop_fv")
            .select("cop_fv.variant_id")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .whereIn("cop_fv.feature_value", transmissionArray)
            .where("cop_features_ms.features_name", Features.transmission);
        });
      }
      if (safety.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .join(
              "cop_spec_ms",
              "cop_features_ms.spec_id",
              "cop_spec_ms.spec_id"
            )
            .where("cop_fv.feature_value", "yes")
            .whereIn("cop_features_ms.features_name", safetyArray)
            .where("cop_spec_ms.spec_name", Specification.safety)
            .groupBy("cop_fv.variant_id");
          // .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
        });
      }
      if (interior.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .join(
              "cop_spec_ms",
              "cop_features_ms.spec_id",
              "cop_spec_ms.spec_id"
            )
            .where("cop_fv.feature_value", "yes")
            .whereIn("cop_features_ms.features_name", interiorArray)
            .where("cop_spec_ms.spec_name", Specification.interior)
            .groupBy("cop_fv.variant_id");
          // .havingRaw("count(cop_fv.feature_id) = ?", [interiorArray.length]);
        });
      }
      if (exterior.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .join(
              "cop_spec_ms",
              "cop_features_ms.spec_id",
              "cop_spec_ms.spec_id"
            )
            .where("cop_fv.feature_value", "yes")
            .whereIn("cop_features_ms.features_name", exteriorArray)
            .where("cop_spec_ms.spec_name", Specification.exterior)
            .groupBy("cop_fv.variant_id");
          // .havingRaw("count(cop_fv.feature_id) = ?", [exteriorArray.length]);
        });
      }
    });

  try {
    const totalQuery = modelQuery
      .clone()
      .clearSelect()
      .clearOrder()
      .clearGroup()
      .countDistinct("cop_models.model_id as total")
      .first();

    const resultsQuery = modelQuery.limit(limit).offset(offset);

    const [totalResult, results] = await Promise.all([
      totalQuery,
      resultsQuery,
    ]);

    const totalRecords = parseInt(totalResult?.total || 0, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: results || [],
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variants = async (
  brand,
  model,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice,
  cityId
) => {
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = db("cop_variants")
    .select(
      db.raw(
        `CONCAT(cop_models.model_name," ",cop_variants.variant_name) as name`
      ),
      db.raw(
        `
        (
          SELECT ex_showroom_price
          FROM cop_pe_ms
          WHERE cop_pe_ms.variant_id = cop_variants.variant_id
            AND cop_pe_ms.status = 1
            AND cop_pe_ms.city_id = ?
        ) AS price`,
        [cityId]
      ),
      "cop_variants.full_slug as slug",
      db.raw(
        `
          (
            SELECT feature_value
            FROM cop_fv
            INNER JOIN cop_features_ms ON cop_features_ms.feature_id = cop_fv.feature_id
            WHERE cop_features_ms.features_name = ? AND cop_fv.variant_id = cop_variants.variant_id
          ) as fuel`,
        [Features.fuel]
      )
    )
    .join("cop_models", "cop_models.model_id", "=", "cop_variants.model_id")
    .join("cop_brands_ms", "cop_brands_ms.brand_id", "=", "cop_models.brand_id")
    .join("cop_cs_ms", "cop_cs_ms.cs_id", "=", "cop_models.cs_id")
    .where("cop_models.model_type", ModelType.nonEv)
    .whereIn("cop_variants.variant_id", function () {
      this.select("cop_pe_ms.variant_id")
        .from("cop_pe_ms")
        .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
    })
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .andWhere("cop_cs_ms.cs_name", CarStages.launched)
    .distinct()
    .modify(function (queryBuilder) {
      if (carTypes.length > 0) {
        queryBuilder.innerJoin(
          "cop_ct_ms",
          "cop_models.ct_id",
          "cop_ct_ms.ct_id"
        );
        queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
      }
      if (fuelTypes.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.from("cop_fv")
            .select("cop_fv.variant_id")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .whereIn("cop_fv.feature_value", fuelTypesArray)
            .where("cop_features_ms.features_name", Features.fuel);
        });
      }
      if (engine.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "=",
              "cop_fv.feature_id"
            );

          engineArray.forEach((range) => {
            const [minEngine, maxEngine] = range
              .split(" to ")
              .map((val) => parseInt(val.trim(), 10));
            this.orWhere(function () {
              this.where(
                "cop_features_ms.features_name",
                Features.displacement
              );
              this.andWhereBetween("cop_fv.feature_value", [
                minEngine,
                maxEngine,
              ]);
            });
          });
        });
      }
      if (driveTrain.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.from("cop_fv")
            .select("cop_fv.variant_id")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .whereIn("cop_fv.feature_value", driveTrainArray)
            .where("cop_features_ms.features_name", Features.driveTrain);
        });
      }
      if (transmission.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.from("cop_fv")
            .select("cop_fv.variant_id")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .whereIn("cop_fv.feature_value", transmissionArray)
            .where("cop_features_ms.features_name", Features.transmission);
        });
      }
      if (safety.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .join(
              "cop_spec_ms",
              "cop_features_ms.spec_id",
              "cop_spec_ms.spec_id"
            )
            .where("cop_fv.feature_value", "yes")
            .whereIn("cop_features_ms.features_name", safetyArray)
            .where("cop_spec_ms.spec_name", Specification.safety)
            .groupBy("cop_fv.variant_id")
            .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
        });
      }
      if (interior.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .join(
              "cop_spec_ms",
              "cop_features_ms.spec_id",
              "cop_spec_ms.spec_id"
            )
            .where("cop_fv.feature_value", "yes")
            .whereIn("cop_features_ms.features_name", interiorArray)
            .where("cop_spec_ms.spec_name", Specification.interior)
            .groupBy("cop_fv.variant_id")
            .havingRaw("count(cop_fv.feature_id) = ?", [interiorArray.length]);
        });
      }
      if (exterior.length > 0) {
        queryBuilder.whereIn("cop_variants.variant_id", function () {
          this.select("cop_fv.variant_id")
            .from("cop_fv")
            .join(
              "cop_features_ms",
              "cop_features_ms.feature_id",
              "cop_fv.feature_id"
            )
            .join(
              "cop_spec_ms",
              "cop_features_ms.spec_id",
              "cop_spec_ms.spec_id"
            )
            .where("cop_fv.feature_value", "yes")
            .whereIn("cop_features_ms.features_name", exteriorArray)
            .where("cop_spec_ms.spec_name", Specification.exterior)
            .groupBy("cop_fv.variant_id")
            .havingRaw("count(cop_fv.feature_id) = ?", [exteriorArray.length]);
        });
      }
    })
    .orderBy("price", "ASC");

  try {
    const data = await query;

    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const budget = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  exterior
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const minPrice = 200000;
  const maxPrice = 200000000;
  const caseStatements = Object.entries(BudgetList)
    .map(([range, label]) => {
      const [min, max] = range.split(" to ").map(Number);
      return `WHEN cop_pe_ms.ex_showroom_price >= ${min} AND cop_pe_ms.ex_showroom_price < ${max} THEN '${label}'`;
    })
    .join(" ");
  const caseStatement = `CASE ${caseStatements} END AS price_range`;

  const query = () => {
    return db("cop_models")
      .select(
        db.raw(`  ${caseStatement},
      COUNT(DISTINCT cop_models.model_id) as count`)
      )
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .join("cop_pe_ms", "cop_pe_ms.variant_id", "=", "cop_variants.variant_id")
      .where("cop_models.model_type", ModelType.nonEv)
      .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice])
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("price_range")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      })
      .orderByRaw(
        `FIELD(price_range, '${Object.values(BudgetList).join("', '")}')`
      );
  };
  try {
    const data = await query();
    const result = data.map((value) => {
      const price = Object.keys(BudgetList).find(
        (key) => BudgetList[key] === value.price_range
      );
      let min = null;
      let max = null;
      if (price) {
        const [minValue, maxValue] = price.split(" to ").map(Number);
        min = minValue;
        max = maxValue;
      }
      return {
        ...value,
        min,
        max,
      };
    });
    return result || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const brands = async (
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_brands_ms.brand_name as name",
        db.raw("COUNT(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .where("cop_models.model_type", ModelType.nonEv)
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_brands_ms.brand_id", "cop_brands_ms.brand_name")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      })
      .orderBy("cop_brands_ms.priority");
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const carTypes = async (
  brands,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_ct_ms.ct_name as name",
        db.raw("count(DISTINCT cop_models.model_id) as count"),
        db.raw(`CONCAT(?,cop_ct_ms.ct_id,'/',cop_ct_ms.ct_image) as image`, [
          imagePath.carTypes,
        ])
      )
      .join("cop_ct_ms", "cop_ct_ms.ct_id", "=", "cop_models.ct_id")
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )

      .where("cop_models.model_type", ModelType.nonEv)
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_ct_ms.ct_id", "cop_ct_ms.ct_image", "cop_ct_ms.ct_name")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      })
      .orderBy("cop_ct_ms.priority");
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const fuelTypes = async (
  brands,
  carTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_fv.feature_value as name",
        db.raw("count(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .whereIn("cop_fv.feature_id", function () {
        this.select("feature_id")
          .from("cop_features_ms")
          .where("features_name", "=", Features.fuel);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_fv.feature_value", "cop_fv.feature_id")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      });
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const engine = async (
  brands,
  carTypes,
  fuelTypes,
  tranmission,
  driveTrain,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const tranmissionArray = tranmission.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const engineRangeList = [
    "0 to 1200",
    "1200 to 1500",
    "1500 to 2000",
    "2000 to 3000",
    "3000 to 5000",
    "5000 to 8000",
  ];

  const caseStatement =
    engineRangeList
      .map((range) => {
        const [min, max] = range
          .split(" to ")
          .map((value) => parseInt(value.trim(), 10));
        return `WHEN cop_fv.feature_value >= ${min} AND cop_fv.feature_value < ${max} THEN '${range}'`;
      })
      .join(" ") + " END AS name";
  const query = () => {
    return db("cop_models")
      .select(
        db.raw(`
          CASE ${caseStatement},
          COUNT(DISTINCT cop_models.model_id) as count
        `)
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")

      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .whereIn("cop_fv.feature_id", function () {
        this.select("feature_id")
          .from("cop_features_ms")
          .where("features_name", "=", Features.displacement);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("name")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (tranmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", tranmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      })
      .orderByRaw(
        `FIELD(name, ${engineRangeList
          .map((range) => `'${range}'`)
          .join(", ")})`
      );
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const transmission = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_fv.feature_value as name",
        db.raw("count(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .whereIn("cop_fv.feature_id", function () {
        this.select("feature_id")
          .from("cop_features_ms")
          .where("features_name", "=", Features.transmission);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_fv.feature_value", "cop_fv.feature_id")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      });
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const driveTrain = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  transmission,
  safety,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_fv.feature_value as name",
        db.raw("count(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .whereIn("cop_fv.feature_id", function () {
        this.select("feature_id")
          .from("cop_features_ms")
          .where("features_name", "=", Features.driveTrain);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_fv.feature_value", "cop_fv.feature_id")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      });
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const safety = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  interior,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_features_ms.features_name as name",
        db.raw("count(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .join(
        "cop_features_ms",
        "cop_features_ms.feature_id",
        "cop_fv.feature_id"
      )
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .where("cop_fv.feature_value", "=", "yes")
      .whereIn("cop_features_ms.spec_id", function () {
        this.select("spec_id")
          .from("cop_spec_ms")
          .where("spec_name", Specification.safety);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_features_ms.features_name", "cop_features_ms.feature_id")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      });
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const interior = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  exterior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const exteriorArray = exterior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_features_ms.features_name as name",
        db.raw("count(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .join(
        "cop_features_ms",
        "cop_features_ms.feature_id",
        "cop_fv.feature_id"
      )
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .where("cop_fv.feature_value", "=", "yes")
      .whereIn("cop_features_ms.features_name", Interior)
      .whereIn("cop_features_ms.spec_id", function () {
        this.select("spec_id")
          .from("cop_spec_ms")
          .where("spec_name", Specification.interior);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_features_ms.features_name", "cop_features_ms.feature_id")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (exterior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", exteriorArray)
              .where("cop_spec_ms.spec_name", Specification.exterior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                exteriorArray.length,
              ]);
          });
        }
      });
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const exterior = async (
  brands,
  carTypes,
  fuelTypes,
  engine,
  driveTrain,
  transmission,
  safety,
  interior,
  minPrice,
  maxPrice
) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const engineArray = engine.split(",").map((item) => item.trim());
  const fuelTypesArray = fuelTypes.split(",").map((item) => item.trim());
  const transmissionArray = transmission.split(",").map((item) => item.trim());
  const driveTrainArray = driveTrain.split(",").map((item) => item.trim());
  const safetyArray = safety.split(",").map((item) => item.trim());
  const interiorArray = interior.split(",").map((item) => item.trim());

  const query = () => {
    return db("cop_models")
      .select(
        "cop_features_ms.features_name as name",
        db.raw("count(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_variants", "cop_variants.model_id", "=", "cop_models.model_id")
      .join("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .join(
        "cop_features_ms",
        "cop_features_ms.feature_id",
        "cop_fv.feature_id"
      )
      .join(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "=",
        "cop_models.brand_id"
      )
      .where("cop_models.model_type", ModelType.nonEv)
      .where("cop_fv.feature_value", "=", "yes")
      .whereIn("cop_features_ms.features_name", Exterior)
      .whereIn("cop_features_ms.spec_id", function () {
        this.select("spec_id")
          .from("cop_spec_ms")
          .where("spec_name", Specification.exterior);
      })
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("cop_features_ms.features_name", "cop_features_ms.feature_id")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (carTypes.length > 0) {
          queryBuilder.innerJoin(
            "cop_ct_ms",
            "cop_models.ct_id",
            "cop_ct_ms.ct_id"
          );
          queryBuilder.whereIn("cop_ct_ms.ct_name", carTypesArray);
        }
        if (engine.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "=",
                "cop_fv.feature_id"
              );

            engineArray.forEach((range) => {
              const [minEngine, maxEngine] = range
                .split(" to ")
                .map((val) => parseInt(val.trim(), 10));
              this.orWhere(function () {
                this.where(
                  "cop_features_ms.features_name",
                  Features.displacement
                );
                this.andWhereBetween("cop_fv.feature_value", [
                  minEngine,
                  maxEngine,
                ]);
              });
            });
          });
        }
        if (fuelTypes.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", fuelTypesArray)
              .where("cop_features_ms.features_name", Features.fuel);
          });
        }
        if (transmission.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", transmissionArray)
              .where("cop_features_ms.features_name", Features.transmission);
          });
        }
        if (driveTrain.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.from("cop_fv")
              .select("cop_fv.variant_id")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .whereIn("cop_fv.feature_value", driveTrainArray)
              .where("cop_features_ms.features_name", Features.driveTrain);
          });
        }
        if (safety.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", safetyArray)
              .where("cop_spec_ms.spec_name", Specification.safety)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [safetyArray.length]);
          });
        }
        if (interior.length > 0) {
          queryBuilder.whereIn("cop_variants.variant_id", function () {
            this.select("cop_fv.variant_id")
              .from("cop_fv")
              .join(
                "cop_features_ms",
                "cop_features_ms.feature_id",
                "cop_fv.feature_id"
              )
              .join(
                "cop_spec_ms",
                "cop_features_ms.spec_id",
                "cop_spec_ms.spec_id"
              )
              .where("cop_fv.feature_value", "yes")
              .whereIn("cop_features_ms.features_name", interiorArray)
              .where("cop_spec_ms.spec_name", Specification.interior)
              .groupBy("cop_fv.variant_id")
              .havingRaw("count(cop_fv.feature_id) = ?", [
                interiorArray.length,
              ]);
          });
        }
      });
  };
  try {
    const data = await query();
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = {
  budget,
  brands,
  carTypes,
  fuelTypes,
  engine,
  transmission,
  driveTrain,
  safety,
  interior,
  exterior,
  models,
  variants,
};
