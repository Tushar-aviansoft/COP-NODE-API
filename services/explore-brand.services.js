const {
  CarStages,
  Features,
  FeaturesDisplayName,
  KeyHighlightsDisplayName,
  SpecificationCategory,
  Description,
  ModelType,
  variantFeatures,
  similarVariantRange,
  carTypes,
  FeaturesArrayForFaq,
  SafetyArrayForFaq,
  predefinedFeatures,
  NewsWP
} = require("../config/constant");
const db = require("../config/database");
const {
  wishListModelSubQuery,
  wishListVariantSubQuery,
  processGraphicFiles
} = require("../config/helper");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const brands = async (models = false, carTypes = false) => {
  try {
    const query = db("cop_brands_ms as brands")
      .select(
        "brands.uuid as id",
        "brands.brand_name",
        db.raw(`CONCAT('/', brands.slug, '-cars') as slug`),
        db.raw(
          `CONCAT(?, brands.brand_id, '/', brands.brand_logo) as brand_logo`,
          [imagePath.brand]
        ),
        db.raw(
          `CONCAT(?, brands.brand_id, '/', brands.brand_banner) as brand_banner`,
          [imagePath.brand]
        )
      )
      .innerJoin("cop_models", "cop_models.brand_id", "brands.brand_id")
      .innerJoin("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .innerJoin("cop_cs_ms", "cop_cs_ms.cs_id", "cop_models.cs_id")
      .innerJoin("cop_ct_ms", "cop_ct_ms.ct_id", "cop_models.ct_id")
      .where("brands.status", 1)
      .andWhere("cop_models.status", 1)
      .andWhere("cop_variants.status", 1)
      .andWhere("cop_cs_ms.cs_name", CarStages.launched)
      .groupBy("brands.brand_id")
      .orderBy("brands.priority")
    if (models) {
      query.select(
        db.raw(
          `GROUP_CONCAT(DISTINCT JSON_OBJECT('id',cop_models.uuid,'name', model_name, 'slug', cop_models.slug)) AS model_data`
        )
      );
    }
    if (carTypes) {
      query.select(
        db.raw(
          `GROUP_CONCAT(DISTINCT ct_name ORDER BY ct_name ASC) AS car_type`
        )
      );
    }
    const result = await query;
    const formattedResult = result.length === 0 ? {} : result.map((brand) => {
      return {
        brand_id: brand.id,
        brand_name: brand.brand_name,
        brand_logo: brand.brand_logo,
        brand_banner: brand.brand_banner,

        slug: brand.slug,
        models: brand.model_data
          ? JSON.parse("[" + brand.model_data + "]")
          : [],
        car_types: carTypes && brand.car_type ? brand.car_type.split(",") : [],
      };
    });
    return formattedResult || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const models = async (
  brandSlug,
  modelSlug,
  carType,
  cityId,
  page = 1,
  limit = 10,
  auth
) => {
  const offset = (page - 1) * limit;

  if (modelSlug) {
    const basicModelQuery = db
      .select(
        db.raw("CONCAT(brand_name, ' ', cop_models.model_name) AS name"),
        db.raw('CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug) AS slug'),
        db.raw(
          `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' , cop_models.model_image) as model_image`,
          [imagePath.brand]
        ),
        "cop_models.image_alt",
        "cop_models.image_title",
        "cop_models.min_price",
        "cop_models.max_price"
      )
      .from("cop_models")
      .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brandSlug)
      .andWhere("cop_models.slug", modelSlug)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .first();

    try {
      const modelData = await basicModelQuery;
      return modelData || [];
    } catch (err) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  const query = db
    .select(
      "ct_name as car_type",
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
      "max_capacity.seating_capacity",
      db.raw(
        "CONCAT(base_feature.feature_value, ' ', base_feature.su_name) AS feature_value"
      ),
      db.raw("COUNT(*) OVER () AS total_count"),
      db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
    )
    .from("cop_models")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .innerJoin(
      db
        .select("model_id")
        .max("seating_capacity AS seating_capacity")
        .from("cop_variants")
        .where("status", 1)
        .groupBy("model_id")
        .as("max_capacity"),
      "max_capacity.model_id",
      "cop_models.model_id"
    )
    .innerJoin("cop_ct_ms", "cop_ct_ms.ct_id", "cop_models.ct_id")
    .leftJoin(
      db
        .select("cop_fv.model_id", "feature_value", "su_name")
        .from("cop_fv")
        .innerJoin(
          "base_variant_id",
          "base_variant_id.variant_id",
          "cop_fv.variant_id"
        )
        .innerJoin("cop_models", "cop_models.model_id", "cop_fv.model_id")
        .innerJoin(
          "cop_features_ms",
          "cop_features_ms.feature_id",
          "cop_fv.feature_id"
        )
        .innerJoin("cop_su_ms", "cop_features_ms.su_id", "cop_su_ms.su_id")
        .where(
          "cop_features_ms.features_name",
          db.raw(
            `CASE WHEN cop_models.model_type = 0 THEN 'Displacement' ELSE 'Battery Capacity' END`
          )
        )
        .as("base_feature"),
      "base_feature.model_id",
      "cop_models.model_id"
    )
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
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brandSlug)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .modify((queryBuilder) => {
      if (carType) {
        queryBuilder.where("ct_name", carType);
      }
    })
    .limit(limit)
    .offset(offset);

  try {
    const data = await query;
    const totalRecords = data.length ? data[0].total_count : 0;
    const totalPages = Math.ceil(totalRecords / limit);

    if (data.length === 0) {
      return [];
    }

    return {
      data,
      totalRecords,
      totalPages,
      currentPage: page,
      perPage: limit,
    };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variants = async (brand, model, cityId, fuelType = 'all') => {

  let upcoming_stage = null;
  try {
    const upcoming_stage_check = await db('cop_models')
      .select(
        'cop_cs_ms.cs_name',
        'cop_msd.model_engine',
        'cop_msd.model_bhp',
        'cop_msd.model_transmission',
        'cop_msd.model_mileage',
        'cop_msd.model_fuel',
        'cop_models.model_type',
        'cop_ct_ms.ct_name as body_type'
      )
      .innerJoin('cop_cs_ms', 'cop_cs_ms.cs_id', 'cop_models.cs_id')
      .innerJoin('cop_ct_ms', 'cop_ct_ms.ct_id', 'cop_models.ct_id')
      .innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_models.brand_id')
      .leftJoin('cop_msd', 'cop_msd.model_id', 'cop_models.model_id')
      .where('cop_models.slug', model)
      .andWhere(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere('cop_models.status', 1)
      .first();

    if (upcoming_stage_check) {
      // upcoming
      if (upcoming_stage_check.cs_name == CarStages.upcoming) {
        let upcoming_data = [];
        upcoming_stage = 1;
        if (upcoming_stage_check.model_type == ModelType.ev) {
          upcoming_data.push({
            'Battery Capacity': upcoming_stage_check.model_engine,
            'Driving Range': upcoming_stage_check.model_mileage,
            'Power': upcoming_stage_check.model_bhp,
            'Charging Time': upcoming_stage_check.model_fuel,
            'Transmission': upcoming_stage_check.model_transmission,
          });
        }
        if (upcoming_stage_check.model_type == ModelType.nonEv) {
          upcoming_data.push({
            'Engine': upcoming_stage_check.model_engine,
            'Fuel': upcoming_stage_check.model_fuel,
            'Transmission': upcoming_stage_check.model_transmission,
            'Mileage': upcoming_stage_check.model_mileage,
            'Power': upcoming_stage_check.model_bhp,
          });
        }
        return { upcoming_stage, body_type: upcoming_stage_check.body_type, upcoming_data };
      }

      // launched
      if (upcoming_stage_check.cs_name == CarStages.launched) {
        let variants = [];
        let fuel_types = [];
        upcoming_stage = 0;

        const query = db("cop_variants")
          .select(
            "cop_brands_ms.brand_name",
            "cop_models.model_name",
            "cop_variants.variant_name",
            "cop_models.image_alt",
            "cop_models.image_title",
            "cop_models.model_type",
            "cop_variants.uuid as id",
            db.raw(`
              JSON_OBJECTAGG(
                cop_features_ms.features_name,
                TRIM(
                  CASE 
                    WHEN cop_su_ms.su_name IS NULL OR cop_fv.feature_value LIKE CONCAT('%', cop_su_ms.su_name)
                    THEN cop_fv.feature_value
                    ELSE CONCAT(cop_fv.feature_value, ' ', cop_su_ms.su_name)
                  END
                )
              ) AS feature_values
            `),
            db.raw(
              `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
              [imagePath.brand]
            ),
            db.raw(
              `MAX(CASE WHEN cop_features_ms.features_name = 'Type of Fuel' THEN cop_fv.feature_value ELSE NULL END) AS fuel_type`
            ),
            db.raw(
              'CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug,"/",cop_variants.slug) AS slug'
            ),
            "full_slug"
          )
          .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
          .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
          .leftJoin("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
          .leftJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .leftJoin("cop_su_ms", "cop_features_ms.su_id", "cop_su_ms.su_id")
          .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
          .andWhere("cop_models.slug", model)
          .whereIn("cop_features_ms.features_name", variantFeatures)
          .andWhere("cop_brands_ms.status", 1)
          .andWhere("cop_models.status", 1)
          .andWhere("cop_variants.status", 1)
          .groupBy(
            // "cop_variants.variant_id",
            // "cop_models.model_name",
            // "cop_variants.variant_name"
            "cop_variants.variant_id",
            "cop_models.model_name",
            "cop_variants.variant_name",
            "cop_brands_ms.brand_name",
            "cop_models.image_alt",
            "cop_models.image_title",
            "cop_brands_ms.brand_id",
            "cop_models.model_id",
            "cop_variants.variant_image",
            "cop_brands_ms.slug",
            "cop_models.slug",
            "cop_variants.slug",
            "full_slug"
          );

        // Add fuel type filter if not 'all'
        if (fuelType && fuelType.toLowerCase() !== 'all' && fuelType && fuelType.toLowerCase() !== 'mileage') {
          query.andWhere(db.raw(
            `EXISTS (
              SELECT 1 FROM cop_fv 
              JOIN cop_features_ms ON cop_features_ms.feature_id = cop_fv.feature_id
              WHERE cop_fv.variant_id = cop_variants.variant_id
              AND cop_features_ms.features_name = ?
              AND LOWER(cop_fv.feature_value) = ?
            )`, [Features.fuel, fuelType.toLowerCase()]
          ));
        }

        if (cityId) {
          query.select(db.raw(
            "CASE WHEN MAX(cop_pe_ms.ex_showroom_price) IS NULL THEN 0 ELSE MAX(cop_pe_ms.ex_showroom_price) END as ex_showroom_price"
          ),)
            .leftJoin("cop_pe_ms", "cop_pe_ms.variant_id", "cop_variants.variant_id")
            .andWhere("cop_pe_ms.city_id", cityId)
            .orderBy("ex_showroom_price", "ASC");
        } else {
          query.select(db.raw(`'N/A' as ex_showroom_price`));
        }

        variants = await query;

        variants = variants.map(variant => {
          if (variant.feature_values) {
            try {
              const parsedFeatures = JSON.parse(variant.feature_values);
              const formattedFeatures = {};

              for (const [key, value] of Object.entries(parsedFeatures)) {
                const formattedKey = key.trim()
                  .replace(/[^a-zA-Z0-9\s]/g, '')
                  .replace(/\s+/g, '_')
                  .toLowerCase();

                formattedFeatures[formattedKey] = typeof value === 'string' ? value.trim() : value;
              }
              if (fuelType && fuelType.toLowerCase() === 'mileage') {
                const mileage = formattedFeatures.mileage || '-';
                const displacement = formattedFeatures.displacement || '';
                const type_of_transmission = formattedFeatures.type_of_transmission || '';
                const battery_capacity = formattedFeatures.battery_capacity || '';
                const charging_time = formattedFeatures.charging_time || '';
                const range = formattedFeatures.range || '-';

                const isEV = variant.model_type == 1;
                if (isEV) {
                  return {
                    powertrain: `EV (${battery_capacity})`,
                    range,
                    chargingTime: charging_time || '-',
                  };
                } else {
                  const type_of_fuel = formattedFeatures.type_of_fuel || '';
                  const powertrain = `${type_of_fuel}-${type_of_transmission} (${displacement})`;
                  const araiMileage = mileage || '-';
                  const realLifeMileageReport = '-';

                  return {
                    powertrain,
                    araiMileage,
                    realLifeMileageReport
                  };
                }
              }
              variant.feature_values = formattedFeatures;
            } catch (e) {
              variant.feature_values = {};
            }
          } else {
            variant.feature_values = {};
          }
          return variant;
        });

        fuel_types = [
          ...new Set(variants.map((item) => item.fuel_type).filter(Boolean)),
        ];
        if (!variants || variants.length === 0) {
          return [];
        }
        return { upcoming_stage, fuel_types, variants };
      }
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Something went wrong");
    }
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const gallery = async (brand, model) => {
  const query = db("cop_models")
    .select(
      "cop_models.model_id",
      "cop_cs_ms.cs_id",
      "cop_graphics.uuid as id",
      db.raw("CONCAT(brand_name, ' ', cop_models.model_name) AS name"),
      "graphic_file",
      "graphic_file as graphic_file_thumb",
      "graphic_file_alt",
      "graphic_file_mob",
      "graphic_file_mob_alt",
      "gt_name"
    )
    .innerJoin("cop_graphics", "cop_models.model_id", "cop_graphics.model_id")
    .innerJoin("cop_cs_ms", "cop_cs_ms.cs_id", "cop_models.cs_id")
    .innerJoin("cop_gt_ms", "cop_gt_ms.gt_id", "cop_graphics.gt_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1);

  try {
    const data = await query;
    if (data.length === 0) {
      return []
    }

    // Create an empty object with the desired order
    const result = {};

    // Process Exterior first
    const exterior = data.find(item => item.gt_name === "Exterior");
    if (exterior) {
      processGraphicFiles(exterior);
      result["Exterior"] = exterior;
    }

    // Then process Interior
    const interior = data.find(item => item.gt_name === "Interior");
    if (interior) {
      processGraphicFiles(interior);
      result["Interior"] = interior;
    }

    // Process any other items that might exist (though your example only shows Exterior/Interior)
    data.forEach(item => {
      if (item.gt_name !== "Exterior" && item.gt_name !== "Interior") {
        processGraphicFiles(item);
        result[item.gt_name] = item;
      }
    });

    return result;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const setPriceAlert = async (auth, brand, model) => {
  const trx = await db.transaction();
  try {
    const ids = await trx('cop_models')
      .select('cop_brands_ms.brand_id', 'cop_models.model_id')
      .innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_models.brand_id')
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere('cop_models.slug', model)
      .andWhere('cop_brands_ms.status', 1)
      .andWhere('cop_models.status', 1)
      .first();

    if (!ids) {
      throw new ApiError(httpStatus.NOT_FOUND, "Brand or model not found");
    }
    const { brand_id, model_id } = ids;

    const existCheck = await trx('cop_price_alert')
      .where('brand_id', brand_id)
      .andWhere('model_id', model_id)
      .andWhere('created_by', auth)
      .andWhere('status', 0)
      .first();
    if (existCheck) {
      throw new ApiError(httpStatus.BAD_REQUEST, "You have already set price alert for this model");
    }

    await trx('cop_price_alert').insert({
      brand_id,
      model_id,
      created_by: auth,
      uuid: db.raw("UUID()"),
    });

    await trx.commit();
    return { message: "Price alert has been set for this model" };
  } catch (err) {
    await trx.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
}

const variantDetail = async (
  brand,
  model,
  variant,
  cityId,
  similarVariants,
  auth
) => {

  const query = db("cop_variants")
    .select(
      "cop_variants.uuid as id",
      "cop_models.uuid as model_id",
      "brand_name",
      "model_name",
      "variant_name",
      "cop_models.model_type",
      "ct_name",
      "cop_models.image_alt",
      "cop_models.image_title",
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_brands_ms.brand_logo) as brand_logo`,
        [imagePath.brand]
      ),
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
        [imagePath.brand]
      ),
      db.raw(`
        JSON_OBJECTAGG(
          cop_features_ms.features_name, 
          CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, ''))
     
        ) AS feature_values
      `),
      "full_slug",
      db.raw(`${wishListVariantSubQuery(auth)} as wishlist`)
    )
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_ct_ms", "cop_ct_ms.ct_id", "cop_models.ct_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .leftJoin("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
    .leftJoin(
      "cop_features_ms",
      "cop_features_ms.feature_id",
      "cop_fv.feature_id"
    )
    .leftJoin("cop_su_ms", "cop_features_ms.su_id", "cop_su_ms.su_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .whereIn("cop_features_ms.features_name", variantFeatures)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .groupBy(
      "cop_variants.variant_id",
      "cop_models.model_name",
      "cop_variants.variant_name",
      "ex_showroom_price",
      "cop_models.model_id"
    );

  if (cityId) {
    query.select(db.raw(
      "CASE WHEN cop_pe_ms.ex_showroom_price IS NULL THEN 0 ELSE cop_pe_ms.ex_showroom_price END as ex_showroom_price"
    ))
      .leftJoin("cop_pe_ms", "cop_pe_ms.variant_id", "cop_variants.variant_id")
      .andWhere("cop_pe_ms.city_id", cityId);
  } else {
    query.select(db.raw(`'N/A' as ex_showroom_price`));
  }

  try {
    const data = await query;
    if (!data || data.length === 0) {
      return [];
    }
    const variantDetail = data.map((item) => {
      if (item.feature_values) {
        const featureObj = JSON.parse(item.feature_values);;
        const order = variantFeatures;
        if (item.model_type != 0) {
          delete featureObj["Type of Transmission"];
        }
        item.feature_values = Object.keys(featureObj)
          .filter((key) => order.includes(key)) // Filter keys based on order array
          .sort((a, b) => order.indexOf(a) - order.indexOf(b)) // Sort by order
          .reduce((sorted, key) => {
            const displayName = FeaturesDisplayName[key] || key; // Get display name or use original
            sorted[displayName] = featureObj[key].trim(); // Remove trailing spaces
            return sorted;
          }, {});
      }
      return item;
    });
    if (similarVariants) {

      const exShowroomPrice = data[0]["ex_showroom_price"];
      const modelType = data[0]["model_type"];
      const modelId = data[0]["model_id"];
      const carType = data[0]["ct_name"];

      let lowerLimit = exShowroomPrice;
      let upperLimit = exShowroomPrice + exShowroomPrice * 0.15;

      Object.keys(similarVariantRange).forEach((range) => {
        const [minRange, maxRange] = range.split("-");
        if (
          exShowroomPrice > parseInt(minRange) &&
          exShowroomPrice <= parseInt(maxRange)
        ) {
          const [lower, upper] = similarVariantRange[range];
          lowerLimit = exShowroomPrice - parseInt(lower);
          upperLimit = exShowroomPrice + parseInt(upper);
        }
      });

      const featureVal = variantFeatures;

      const fValues = featureVal.map((val) => `'${val}'`).join(",");

      const similarVariantsQuery = db("cop_models")
        .select(
          "cop_models.uuid as model_id",
          "brand_name",
          "model_name",
          db.raw(
            `
            (
              SELECT JSON_OBJECT(
                'id', cop_variants.uuid,
                'full_slug',LOWER(CONCAT(
                  REPLACE(cop_brands_ms.slug, ' ', '-'),
                  '-cars/',
                  REPLACE(cop_models.slug, ' ', '-'),
                  '/',
                  REPLACE(cop_variants.slug, ' ', '-')
                )),
                'variant_name', cop_variants.variant_name,
                'variant_image', CONCAT('${imagePath.brand}', cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image),
                'ex_showroom_price', MIN(cop_pe_ms.ex_showroom_price),
                'feature_values', (
                  SELECT GROUP_CONCAT(
                    JSON_OBJECT(
                      cop_features_ms.features_name,
                      CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, ''))
                    )
                    ORDER BY FIELD(
                      cop_features_ms.features_name,
                      ${fValues} 
                    )
                  )
                  FROM cop_fv
                  INNER JOIN cop_features_ms ON cop_features_ms.feature_id = cop_fv.feature_id
                  LEFT JOIN cop_su_ms ON cop_features_ms.su_id = cop_su_ms.su_id
                  WHERE cop_fv.variant_id = cop_variants.variant_id
                  AND features_name IN (
                    ${fValues}
                  )
                )
              )
              FROM cop_variants
              INNER JOIN cop_pe_ms ON cop_variants.variant_id = cop_pe_ms.variant_id
              WHERE cop_variants.model_id = cop_models.model_id AND cop_variants.status=1
              AND city_id = ?
              AND cop_pe_ms.ex_showroom_price BETWEEN ? AND ?
              GROUP BY cop_pe_ms.model_id, cop_variants.variant_image, cop_variants.variant_id, cop_variants.variant_name,ex_showroom_price
              ORDER BY ex_showroom_price ASC
              LIMIT 1
            ) as variant_json
          `,
            [cityId, lowerLimit, upperLimit]
          )
        )
        .leftJoin(
          "cop_brands_ms",
          "cop_models.brand_id",
          "cop_brands_ms.brand_id"
        )
        .leftJoin("cop_ct_ms", "cop_ct_ms.ct_id", "cop_models.ct_id")
        .where("cop_models.uuid", "!=", modelId)
        .where("cop_models.status", 1)
        .andWhere("cop_models.model_type", "=", modelType)
        .where(function () {
          if (exShowroomPrice < 1000000) {
            this.whereIn("cop_ct_ms.ct_name", [
              carTypes.hatchback,
              carTypes.sedan,
              carType,
            ]);
          } else {
            this.where("cop_ct_ms.ct_name", carType);
          }
        })
        .whereIn(
          "cop_models.model_id",
          db("cop_pe_ms")
            .select("cop_pe_ms.model_id")
            .where("city_id", cityId)
            .whereBetween("cop_pe_ms.ex_showroom_price", [
              lowerLimit,
              upperLimit,
            ])
            .groupBy("cop_pe_ms.model_id")
        )
        .havingNotNull("variant_json")
        .limit(6);


      const result = await similarVariantsQuery;
      const similarVariantsResult = result.filter(variant => variant.variant_json !== null)
        .map((variant) => {
          if (variant.variant_json) {
            const variant_details = JSON.parse(variant.variant_json);
            const {
              id,
              variant_name,
              variant_image,
              feature_values,
              ex_showroom_price,
              full_slug,
            } = variant_details;

            let featureValues = {};

            if (feature_values) {
              let featuresArray;

              if (typeof feature_values === 'string') {
                try {
                  featuresArray = JSON.parse(feature_values.startsWith('[') ?
                    feature_values :
                    `[${feature_values}]`);
                } catch (e) {
                  console.error('Failed to parse feature_values:', feature_values);
                  featuresArray = [];
                }
              } else if (Array.isArray(feature_values)) {
                featuresArray = feature_values;
              } else {
                featuresArray = [];
              }

              featureValues = featuresArray.reduce((acc, feature) => {
                if (feature && typeof feature === 'object') {
                  const key = Object.keys(feature)[0];
                  if (key) {
                    const value = feature[key];
                    const underscoreKey = key.trim()
                      .replace(/\s+/g, '_')
                      .replace(/[()]/g, '');
                    acc[underscoreKey] = typeof value === 'string' ? value.trim() : value;
                  }
                }
                return acc;
              }, {});
            }
            return {
              id: id,
              brand_name: variant.brand_name,
              model_name: variant.model_name,
              variant_name,
              variant_image,
              feature_values: featureValues,
              ex_showroom_price,
              full_slug,
            };
          }

          return variant || [];
        });
      return { similar_variants: similarVariantsResult || [] };
    }
    return { variant_detail: variantDetail || [] };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variantColors = async (brand, model, variant) => {
  const query = db("cop_colors")
    .select(
      "cop_colors.uuid as id",
      db.raw(
        "CONCAT(brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name"
      ),
      "color_name",
      "color_code",
      "dual_color_code",
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/', cop_variants.variant_id,'/',variant_color_image) as image`,
        [imagePath.brand]
      ),
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/', cop_variants.variant_id,'/',variant_color_image_mob) as image_mob`,
        [imagePath.brand]
      )
    )
    .innerJoin(
      "cop_variants",
      "cop_variants.variant_id",
      "cop_colors.variant_id"
    )
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1);

  try {
    const data = await query;
    if (!data || data.length === 0) {
      return [];
    }
    return data;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variantPrice = async (brand, model, variant, cityId, auth) => {
  try {
    // Main query to get all variants of the model
    const query = db("cop_pe_ms")
      .select(
        "cop_variants.uuid as id",
        db.raw(
          "CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name"
        ),
        db.raw(`ex_showroom_price as 'Ex-showroom Price'`),
        db.raw(`i_rto_price as 'RTO'`),
        "tax_cost",
        "cop_variants.variant_name",
        db.raw(`
          (
            SELECT CONCAT(cop_fv.feature_value, IFNULL(CONCAT(' ', cop_su_ms.su_name), ''))
            FROM cop_fv
            JOIN cop_features_ms ON cop_features_ms.feature_id = cop_fv.feature_id
            LEFT JOIN cop_su_ms ON cop_su_ms.su_id = cop_features_ms.su_id
            WHERE cop_fv.variant_id = cop_variants.variant_id
              AND cop_features_ms.features_name = 'Type of Fuel'
            LIMIT 1
          ) as fuel_type
        `)
      )
      .innerJoin("cop_variants", "cop_variants.variant_id", "cop_pe_ms.variant_id")
      .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
      .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .leftJoin("cop_fv", "cop_fv.variant_id", "cop_variants.variant_id")
      .leftJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
      .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
      .where("cop_pe_ms.city_id", cityId)
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere("cop_models.slug", model)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .andWhere("cop_variants.status", 1)
      .groupBy(
        "cop_variants.uuid",
        "cop_variants.variant_name",
        "ex_showroom_price",
        "i_rto_price",
        "cop_pe_ms.tax_cost",
        "cop_pe_ms.tax_id"
      );

    // Check for price alerts (for the specific variant)
    const checkPriceAlert = await db("cop_price_alert")
      .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_price_alert.brand_id")
      .innerJoin("cop_models", "cop_models.model_id", "cop_price_alert.model_id")
      .innerJoin("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere("cop_models.slug", model)
      .andWhere("cop_variants.slug", variant)
      .andWhere("cop_price_alert.created_by", auth || 0)
      .andWhere("cop_price_alert.status", 0)
      .first();

    // Get tax information
    const taxQuery = await db("cop_taxes_ms")
      .select("tax_id", "tax_name")
      .orderBy("tax_name");

    // Get city name
    const city = await db("cop_city_ms")
      .select("city_name")
      .where("city_id", cityId)
      .first();
    const cityName = city?.city_name
      ? `on_road_price`
      : "on_road_price";

    // Execute main query and process results
    const data = await query;
    if (!data || data.length === 0) {
      return [];
    }

    // Get unique fuel types
    const fuelTypes = [...new Set(data.map(item => item.fuel_type || ""))];

    // Process all variants
    const variants = data.map((item) => {
      const taxCost = JSON.parse(item.tax_cost || "{}");
      const renamedTaxCost = {};

      taxQuery.forEach((tax) => {
        if (taxCost[tax.tax_id]) {
          renamedTaxCost[tax.tax_name] = Math.round(taxCost[tax.tax_id]);
        }
      });

      const taxValues = Object.values(renamedTaxCost);
      const totalPrice = taxValues.reduce((sum, value) => sum + value, 0) +
        item["Ex-showroom Price"] +
        item["RTO"];

      return {
        id: item.id,
        name: item.name,
        variant_name: item.variant_name,
        fuel_type: item.fuel_type || "",
        "ex_showroom_price": item["Ex-showroom Price"],
        "RTO": item["RTO"],
        ...renamedTaxCost,
        [cityName]: Math.round(totalPrice),
        set_price_alert: checkPriceAlert ? 1 : 0,
      };
    });

    return {
      fuel_types: fuelTypes || [], // Array of unique fuel types
      variants: variants || []    // Array of all variants
    };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variantSpecifications = async (brand, model, variant, isShort) => {
  const query = db("cop_fv")
    .select(
      "cop_variants.uuid as id",
      db.raw(
        "CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name"
      ),
      "sc_name",
      "spec_name",
      db.raw(`CONCAT(?, cop_spec_ms.spec_id, '/', spec_image) as spec_image`, [
        imagePath.specification,
      ]),
      "features_name",
      db.raw(
        `CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, '')) as feature_value`
      )
    )
    .innerJoin(
      "cop_features_ms",
      "cop_features_ms.feature_id",
      "cop_fv.feature_id"
    )
    .innerJoin("cop_spec_ms", "cop_spec_ms.spec_id", "cop_features_ms.spec_id")
    .innerJoin("cop_sc_ms", "cop_sc_ms.sc_id", "cop_spec_ms.sc_id")
    .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1);

  try {
    const data = await query;

    if (!data || data.length === 0) {
      return [];
    }

    const transformedData = data.reduce((acc, item) => {
      const { sc_name, spec_name, features_name, feature_value, spec_image } = item;

      if (isShort) {
        // Initialize the main structure in the desired order
        if (!acc.engineTransFuel) acc.engineTransFuel = {};
        if (!acc.features) acc.features = {};
        if (!acc.warranty) acc.warranty = {};

        // Check which group this item belongs to
        let matchedGroup = null;
        for (const [groupName, group] of Object.entries(predefinedFeatures)) {
          if (group.type === 'spec_name' && group.values.includes(spec_name)) {
            matchedGroup = groupName;
            break;
          }
          if (group.type === 'features_name' && group.values.includes(features_name)) {
            matchedGroup = groupName;
            break;
          }
        }

        if (!matchedGroup) return acc;

        // 1. Handle engine/transmission/fuel first
        if (matchedGroup === 'engineTransmissionFuel') {
          if (!acc.engineTransFuel[spec_name]) {
            acc.engineTransFuel[spec_name] = {
              name: spec_name,
              details: []
            };
          }
          acc.engineTransFuel[spec_name].details.push({
            features_name,
            feature_value: feature_value.trim()
          });
          return acc;
        }

        // 3. Handle warranty features last
        if (matchedGroup === 'warrantyFeatures') {
          if (!acc.warranty[spec_name || features_name]) {
            acc.warranty[spec_name || features_name] = {
              name: spec_name || features_name,
              details: []
            };
          }
          acc.warranty[spec_name || features_name].details.push({
            features_name: features_name,
            feature_value: feature_value.trim()
          });
          return acc;
        }

        // 2. Handle the four main feature categories in the middle
        const featureCategories = [
          'innovative_Features',
          'infotainment_System',
          'connectivity_Features',
          'safety_And_Driver_Assistance'
        ];

        if (featureCategories.includes(matchedGroup)) {
          if (!acc.features[matchedGroup]) {
            acc.features[matchedGroup] = {
              name: matchedGroup,
              details: []
            };
          }
          acc.features[matchedGroup].details.push({
            features_name,
            feature_value: feature_value.trim()
          });
        }

        return acc;
      }

      // Original full version logic
      if (!acc[sc_name]) {
        acc[sc_name] = {};
      }
      if (!acc[sc_name][spec_name]) {
        acc[sc_name][spec_name] = {
          name: spec_name,
          image: spec_image,
          details: [],
        };
      }
      acc[sc_name][spec_name].details.push({
        features_name,
        feature_value,
      });

      return acc;
    }, {});

    // Return the structured data
    if (isShort) {
      return {
        engineTransFuel: transformedData.engineTransFuel || {},
        features: transformedData.features || {},
        warranty: transformedData.warranty || {}
      };
    } else {
      return transformedData || []; // Return the full version result
    }
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variantKeyHighlights = async (brand, model, variant) => {
  const query = db("cop_fv")
    .select(
      db.raw(
        "CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name"
      ),
      "sc_name",
      db.raw(
        `CONCAT(?, cop_features_ms.feature_id, '/', cop_features_ms.features_image) as features_image`,
        [imagePath.feature]
      ),
      "features_name",
      db.raw(
        `CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, '')) as feature_value`
      )
    )
    .innerJoin(
      "cop_features_ms",
      "cop_features_ms.feature_id",
      "cop_fv.feature_id"
    )
    .innerJoin("cop_spec_ms", "cop_spec_ms.spec_id", "cop_features_ms.spec_id")
    .innerJoin("cop_sc_ms", "cop_sc_ms.sc_id", "cop_spec_ms.sc_id")
    .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .andWhere("key_highlight", 1);

  try {
    const data = await query;
    if (!data || data.length === 0) {
      return [];
    }
    const transformedData = data.reduce((result, item) => {
      const { sc_name, features_name, feature_value, features_image } = item;
      const categoryName = KeyHighlightsDisplayName[sc_name] || sc_name;
      const displayName = FeaturesDisplayName[features_name] || features_name;
      if (!result[categoryName]) {
        result[categoryName] = [];
      }
      const featureData = {
        features_name: displayName,
        features_image,
      };

      if (sc_name !== SpecificationCategory.safety) {
        featureData.feature_value = feature_value;
      }

      result[categoryName].push(featureData);

      return result;
    }, {});
    return transformedData || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variantDescription = async (brand, model, variant, cityId) => {
  const query = db("cop_variants")
    .select(
      db.raw(
        "CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name"
      ),
      "sc_name",
      "features_name",
      db.raw(
        `CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, '')) as feature_value`
      )
    )
    .leftJoin("cop_fv", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin(
      "cop_features_ms",
      "cop_features_ms.feature_id",
      "cop_fv.feature_id"
    )
    .innerJoin("cop_spec_ms", "cop_spec_ms.spec_id", "cop_features_ms.spec_id")
    .innerJoin("cop_sc_ms", "cop_sc_ms.sc_id", "cop_spec_ms.sc_id")
    .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .whereIn("cop_features_ms.features_name", Description)
    .andWhereNot("feature_value", "No");

  const detailQuery = db("cop_variants")
    .select(
      db.raw(
        "CONCAT(brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name"
      ),
      "ct_name",
      "model_type",
      "seating_capacity"
    )
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .innerJoin("cop_ct_ms", "cop_ct_ms.ct_id", "cop_models.ct_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .limit(1);
  if (cityId) {
    detailQuery.select("ex_showroom_price")
      .leftJoin("cop_pe_ms", "cop_pe_ms.variant_id", "cop_variants.variant_id")
      .andWhere("cop_pe_ms.city_id", cityId);
  } else {
    detailQuery.select(db.raw(`'N/A' as ex_showroom_price`));
  }

  try {
    const data1 = await query;
    const detail = await detailQuery;

    const data = data1.reduce((result, item) => {
      const { name, sc_name, features_name, feature_value, features_image } =
        item;
      const displayName = FeaturesDisplayName[features_name] || features_name;
      if (!result[sc_name]) {
        result[sc_name] = [];
      }
      const featureData = {
        features_name: displayName,
        features_image,
        feature_value,
      };

      result[sc_name].push(featureData);

      return result;
    }, {});
    const model = detail[0]["name"];
    const description = {};
    const modelType = detail[0]["model_type"];
    const bodyType = detail[0]["ct_name"];
    const price = detail[0]["ex_showroom_price"];

    //price
    description[modelName] = "";
    if (price) {
      description[
        "Price"
      ] = `${modelName} variant price in India is ₹${price.toLocaleString(
        "en-IN"
      )}`;
    }

    // Body Type, Seating Capacity, and Mileage/Range
    if (data.Specifications) {
      const specifications = data.Specifications;
      const seatingCapacity = detail[0]["seating_capacity"];
      let mileage = "";
      let range = "";

      if (modelType == ModelType.ev) {
        range = specifications.find(
          (spec) => spec.features_name === "Driving Range"
        )?.feature_value;
      } else {
        mileage = specifications.find(
          (spec) => spec.features_name === "Mileage"
        )?.feature_value;
      }

      const mileageOrRangeText = mileage
        ? `Average mileage is ${mileage}.`
        : range
          ? `Claimed range is upto ${range}.`
          : "";
      const mileageKey = `Body Type, Seating Capacity ${mileageOrRangeText
        ? modelType == ModelType.ev
          ? "and Range"
          : "and Mileage"
        : ""
        }`;
      description[
        mileageKey
      ] = `This ${bodyType} is a ${seatingCapacity}-seater. ${mileageOrRangeText}`;
    }

    // Fuel type or Electric type
    if (data.Specifications) {
      const fuelType =
        modelType == ModelType.ev
          ? "Electric only"
          : data.Specifications.find((spec) => spec.features_name === "Fuel")
            ?.feature_value;

      description["Available in one fuel type"] = `${modelType == ModelType.ev ? "Electric only" : fuelType
        }`;
    }

    // Transmission and Power details
    if (data.Specifications) {
      const transmission = data.Specifications.find(
        (spec) => spec.features_name === "Transmission"
      )?.feature_value;
      const power = data.Specifications.find(
        (spec) => spec.features_name === "Power"
      )?.feature_value;
      if (transmission || power) {
        const transPowerkey = `${transmission ? "Transmission Type" : ""}${power && transmission ? " and" : ""
          }${power ? " Power" : ""}`;
        description[transPowerkey] = `${modelName} ${transmission ? `comes with ${transmission}transmission.` : ""
          } ${power ? `Serves the power of ${power}.` : ""}`.trim();
      }
    }

    // Interior and Exterior Features
    if (data.Features) {
      const interiorExteriorFeatures = data.Features.map(
        (feature) => feature.features_name
      ).join(", ");
      description[
        "Key Features for Interior and Exterior"
      ] = `Highlights include ${interiorExteriorFeatures}.`;
    }

    // Safety Features
    if (data.Safety) {
      const safetyFeatures = data.Safety.map(
        (safety) => safety.features_name
      ).join(", ");
      description[
        "Safety Features"
      ] = `Safety features include ${safetyFeatures}.`;
    }

    return description || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const variantFaq = async (brand, model, variant, cityId) => {

  const brandModelDetailsGet = db("cop_models")
    .select(
      db.raw(`CONCAT(cop_brands_ms.brand_name,' ',cop_models.model_name) as name`),
      "cop_models.model_type"
    )
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where("cop_models.slug", model)
    .first();

  const faqOtherDetailsGet = db("cop_fv")
    .select(
      db.raw(
        `GROUP_CONCAT(
                JSON_OBJECT(
                    'feature_value', CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, '')),
                    'feature_name', cop_features_ms.features_name
                )
          ) AS feature_json`
      )
    )
    .innerJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
    .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .whereIn("cop_features_ms.features_name", [
      Features.displacement,
      Features.typeOfEngine,
      Features.mileage,
      Features.noOfAirbags,
      Features.drivingRange,
      Features.batteryType
    ])
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .first();

  const featureValueGet = db("cop_fv")
    .select(
      db.raw("GROUP_CONCAT(cop_features_ms.features_name) as features")
    )
    .innerJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .whereIn("cop_features_ms.features_name", FeaturesArrayForFaq)
    .andWhere("cop_fv.feature_value", "=", "Yes")
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .first();

  const safetyValueGet = db("cop_fv")
    .select(
      db.raw("GROUP_CONCAT(cop_features_ms.features_name) as safety")
    )
    .innerJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .whereIn("cop_features_ms.features_name", SafetyArrayForFaq)
    .andWhere("cop_fv.feature_value", "!=", "No")
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .first();

  const exShowroomPriceGet = db("cop_pe_ms")
    .select(
      db.raw(`MIN(cop_pe_ms.ex_showroom_price) AS ex_showroom_price`)
    )
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_pe_ms.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .where("cop_models.slug", model)
    .andWhere("cop_pe_ms.city_id", cityId)
    .andWhere("cop_variants.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_pe_ms.status", 1)
    .first();

  try {
    const brandModelDetails = await brandModelDetailsGet;
    const faqOtherDetailsData = await faqOtherDetailsGet;
    const featureActiveData = await featureValueGet;
    const safetyActiveData = await safetyValueGet;
    const exShowroomPrice = await exShowroomPriceGet;

    const mapDisplayNames = (data) => {
      const key = Object.keys(data)[0]; // Get the key, e.g., "features"
      const featureValues = data[key]; // Get the value, e.g., "Multifunction Steering Wheel,..."

      if (featureValues) {
        return {
          [key]: featureValues
            .split(",")
            .map((feature) => FeaturesDisplayName[feature.trim()] || feature.trim())
            .join(", "),
        };
      } else {
        return { [key]: null };
      }
    };
    const featureMap = (feature) => faqOtherDetails.find((item) => item.feature_name === feature)?.feature_value;

    const faqOtherDetails = faqOtherDetailsData.feature_json ? JSON.parse(`[${faqOtherDetailsData.feature_json}]`) : [];
    let featureActive = featureActiveData ? mapDisplayNames(featureActiveData) : [];
    let safetyActive = safetyActiveData ? mapDisplayNames(safetyActiveData) : [];

    const displacement = featureMap(Features.displacement);
    const typeOfEngine = featureMap(Features.typeOfEngine);
    const mileage = featureMap(Features.mileage);
    const airbags = featureMap(Features.noOfAirbags);
    const drivingRange = featureMap(Features.drivingRange);
    const batteryType = featureMap(Features.batteryType);

    const faqs = [];


    if (featureActive.features) {
      const features = featureActive.features.split(',').map(feature => feature.trim());


      const mainFeature = features[0];
      const additionalFeaturesArray = features.slice(1);
      const additionalFeatures = additionalFeaturesArray.join(", ");

      faqs.push({
        qus: `What are the key features of the ${brandModelDetails.name}?`,
        ans: `The ${brandModelDetails.name} is equipped with <strong>${mainFeature}</strong>. Additionally, it has lavish facilities like <strong>${additionalFeatures}</strong>.`
      });
    }

    if (exShowroomPrice.ex_showroom_price) {
      faqs.push({
        qus: `How much is the starting price for ${brandModelDetails.name}?`,
        ans: `Its starting price is set at a competitive INR <strong>${exShowroomPrice.ex_showroom_price}</strong>.`
      });
    }

    if (safetyActive.safety) {
      if (airbags) {
        safetyActive.safety = safetyActive.safety.replace("Airbags", airbags.trim() + " Airbags");
      }
      faqs.push({
        qus: `What are ${brandModelDetails.name}’s safety features?`,
        ans: `The car has safety features that includes <strong>${safetyActive.safety}</strong>.`
      });
    }

    if ((displacement || typeOfEngine) && brandModelDetails.model_type == ModelType.nonEv) {
      if (displacement && typeOfEngine) {
        faqs.push({
          qus: `What are the engine type and capacity for ${brandModelDetails.name}?`,
          ans: `The ${brandModelDetails.name} features a <strong>${displacement}</strong> engine with <strong>${typeOfEngine}</strong>, offering powerful and efficient performance.`
        });
      } else if (displacement && !typeOfEngine) {
        faqs.push({
          qus: `What is the engine capacity of ${brandModelDetails.name}?`,
          ans: `The ${brandModelDetails.name} features a <strong>${displacement}</strong> engine, offering powerful and efficient performance.`
        });
      } else if (!displacement && typeOfEngine) {
        faqs.push({
          qus: `What is the engine type of ${brandModelDetails.name}?`,
          ans: `The ${brandModelDetails.name} features a <strong>${typeOfEngine}</strong> engine, offering powerful and efficient performance.`
        });
      }
    }
    if (batteryType && brandModelDetails.model_type == ModelType.ev) {
      faqs.push({
        qus: `What type of battery does the ${brandModelDetails.name} use?`,
        ans: `The ${brandModelDetails.name} features a <strong>${batteryType.trim()}${batteryType.toLowerCase().includes("battery") ? '' : ' battery'}</strong>, offering powerful and efficient performance.`
      });
    }

    if (mileage && brandModelDetails.model_type == ModelType.nonEv) {
      faqs.push({
        qus: `What is the fuel efficiency of ${brandModelDetails.name}?`,
        ans: `The ${brandModelDetails.name} is one that known for its fuel efficiency, which is <strong>${mileage}</strong>.`
      });
    }
    if (drivingRange && brandModelDetails.model_type == ModelType.ev) {
      faqs.push({
        qus: `What is the driving range of ${brandModelDetails.name}?`,
        ans: `The ${brandModelDetails.name} is one that known for its driving range, which is <strong>${drivingRange}</strong>.`
      });
    }

    return faqs || [];

  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
}

//new design api

// API for Model Description, thing like and improve
const modelDescription = async (brand, model) => {
  const query = db("cop_models")
    .select(
      "description",
      "thing_like",
      "thing_improve",
    )
    .innerJoin("cop_model_desc", "cop_models.model_id", "cop_model_desc.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .first();

  try {
    const data = await query;
    return data || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

// API for similar models from brand 
const similarModels = async (brand) => {
  try {
    const query = db("cop_brands_ms as brands")
      .select(
        "brands.uuid as id",
        "brands.brand_name",
      )
      .innerJoin("cop_models", "cop_models.brand_id", "brands.brand_id")
      .innerJoin("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .innerJoin("cop_cs_ms", "cop_cs_ms.cs_id", "cop_models.cs_id")
      .innerJoin("cop_ct_ms", "cop_ct_ms.ct_id", "cop_models.ct_id")
      .where("brands.status", 1)
      .where(db.raw(`CONCAT(brands.slug, '-cars')`), brand)
      .andWhere("cop_models.status", 1)
      .andWhere("cop_variants.status", 1)
      .andWhere("cop_cs_ms.cs_name", CarStages.launched)
      .first();

    if (models) {
      query.select(
        db.raw(
          `(SELECT GROUP_CONCAT(DISTINCT JSON_OBJECT(
              'id', m.uuid, 
              'car_type', ct.ct_name, 
              'name', m.model_name, 
              'slug', m.slug,
              'image', CONCAT(?, m.brand_id, '/', m.model_id, '/', m.model_image),
              'min_price', m.min_price,
              'max_price', m.max_price
            )) 
            FROM cop_models m
            INNER JOIN cop_ct_ms ct ON ct.ct_id = m.ct_id
            INNER JOIN cop_cs_ms cs ON cs.cs_id = m.cs_id  
            WHERE m.brand_id = brands.brand_id 
              AND m.status = 1 
              AND cs.cs_name = ?  
            ) AS model_data`,
          [imagePath.brand, CarStages.launched]
        )
      );
    }

    const result = await query;
    if (!result) {
      return [];
    }

    const formattedResult = {
      brand_id: result.id,
      brand_name: result.brand_name,
      models: result.model_data ? JSON.parse("[" + result.model_data + "]") : [],
    };

    return formattedResult || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};



const newsBlogsModelList = async (brand) => {
  try {
    if (!brand || brand.trim() === "") {
      throw new Error("missing_required_field");
    }

    const models = await db("cop_models")
      .select(
        "cop_brands_ms.brand_id",
        "cop_brands_ms.brand_name",
        "cop_brands_ms.slug as brand_slug",
        "cop_models.model_id",
        "cop_models.model_name",
        "cop_models.slug as model_slug",
        db("cop_variants")
          .select("cop_variants.variant_id")
          .whereRaw("cop_variants.model_id = cop_models.model_id")
          .andWhere("cop_variants.status", 1)
          .limit(1)
          .as("variant_id"),
        db("cop_variants")
          .select("cop_variants.variant_image")
          .whereRaw("cop_variants.model_id = cop_models.model_id")
          .andWhere("cop_variants.status", 1)
          .limit(1)
          .as("variant_image"),
        db("cop_pe_ms")
          .min("ex_showroom_price")
          .whereRaw("cop_pe_ms.model_id = cop_models.model_id")
          .andWhere("cop_pe_ms.city_id", NewsWP.CITY_ID)
          .andWhere("cop_pe_ms.status", 1)
          .as("min_ex_showroom_price"),
        db("cop_pe_ms")
          .max("ex_showroom_price")
          .whereRaw("cop_pe_ms.model_id = cop_models.model_id")
          .andWhere("cop_pe_ms.city_id", NewsWP.CITY_ID)
          .andWhere("cop_pe_ms.status", 1)
          .as("max_ex_showroom_price")
      )
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .join("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .where("cop_brands_ms.brand_name", brand)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .distinct();

    if (!models || models.length === 0) {
      throw new Error("data_not_found");
    }

    return models.map((item) => {
      const encryptedBrandId = item.brand_id;
      const encryptedModelId = item.model_id;
      const encryptedVariantId = item.variant_id;
      const variantImagePath = `${imagePath.brand}${item.brand_id}/${item.model_id}/${item.variant_id}/${item.variant_image}`;
      const price = (item.min_ex_showroom_price, item.max_ex_showroom_price);

      return {
        ...item,
        brand_id: encryptedBrandId,
        model_id: encryptedModelId,
        variant_id: encryptedVariantId,
        variant_image: variantImagePath,
        price,
      };
    });
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};



const newsBlogsModelDescription = async (model) => {
  try {
    if (!model || model.trim() === "") {
      throw new Error("missing_required_field");
    }

    const displacement = Features.displacement;
    const mileage = Features.mileage;
    const transmission = Features.transmission;
    const battery_capacity = Features.batteryCapacity;
    const range = FeaturesDisplayName.Range;
    const power = Features.power;
    const power_ev = Features.evPower;
    const cityId = NewsWP.CITY_ID;

    const models = await db("cop_models")
      .select(
        "cop_brands_ms.brand_id",
        "cop_brands_ms.brand_name",
        "cop_brands_ms.slug as brand_slug",
        "cop_models.model_id",
        "cop_models.model_name",
        "cop_models.model_type",
        "cop_models.slug as model_slug",
        db("cop_variants")
          .select("cop_variants.variant_id")
          .whereRaw("cop_variants.model_id = cop_models.model_id")
          .andWhere("cop_variants.status", 1)
          .limit(1)
          .as("variant_id"),
        db("cop_variants")
          .select("cop_variants.variant_image")
          .whereRaw("cop_variants.model_id = cop_models.model_id")
          .andWhere("cop_variants.status", 1)
          .limit(1)
          .as("variant_image"),
        db("cop_pe_ms")
          .min("ex_showroom_price")
          .whereRaw("cop_pe_ms.model_id = cop_models.model_id")
          .andWhere("cop_pe_ms.city_id", cityId)
          .andWhere("cop_pe_ms.status", 1)
          .as("min_ex_showroom_price"),
        db("cop_pe_ms")
          .max("ex_showroom_price")
          .whereRaw("cop_pe_ms.model_id = cop_models.model_id")
          .andWhere("cop_pe_ms.city_id", cityId)
          .andWhere("cop_pe_ms.status", 1)
          .as("max_ex_showroom_price"),
        db("cop_colors")
          .select(
            db.raw(`JSON_ARRAYAGG(JSON_OBJECT(
              "color_id", cop_colors.color_id,
              "color_name", cop_colors.color_name,
              "color_code", cop_colors.color_code,
              "dual_color_code", cop_colors.dual_color_code
            ))`)
          )
          .whereRaw("cop_colors.variant_id = cop_variants.variant_id")
          .as("variant_colors"),
        db("cop_fv")
          .select(db.raw("MIN(CAST(cop_fv.feature_value AS DOUBLE))"))
          .leftJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name IN ("${displacement}", "${battery_capacity}")`)
          .groupBy("cop_su_ms.su_name")
          .as("displacement_or_battery_cap"),
        db("cop_fv")
          .select(
            db.raw(`JSON_ARRAYAGG(JSON_OBJECT(
              "feature_id", cop_features_ms.feature_id,
              "feature_image", cop_features_ms.features_image
            ))`)
          )
          .join("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name IN ("${displacement}", "${battery_capacity}")`)
          .as("displacement_or_battery_cap_data"),
        db("cop_fv")
          .select(db.raw("MIN(CAST(cop_fv.feature_value AS DOUBLE))"))
          .leftJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name IN ("${mileage}", "${range}")`)
          .groupBy("cop_su_ms.su_name")
          .as("mileage_or_range"),
        db("cop_fv")
          .select(
            db.raw(`JSON_ARRAYAGG(JSON_OBJECT(
              "feature_id", cop_features_ms.feature_id,
              "feature_image", cop_features_ms.features_image
            ))`)
          )
          .join("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name IN ("${mileage}", "${range}")`)
          .as("mileage_or_range_data"),
        db("cop_fv")
          .select(db.raw("MIN(CAST(cop_fv.feature_value AS DOUBLE))"))
          .leftJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name IN ("${power}", "${power_ev}")`)
          .groupBy("cop_su_ms.su_name")
          .as("power"),
        db("cop_fv")
          .select(
            db.raw(`JSON_ARRAYAGG(JSON_OBJECT(
              "feature_id", cop_features_ms.feature_id,
              "feature_image", cop_features_ms.features_image
            ))`)
          )
          .join("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name IN ("${power}", "${power_ev}")`)
          .as("power_data"),
        db("cop_fv")
          .select("cop_fv.feature_value")
          .join("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name = "${transmission}"`)
          .as("transmission"),
        db("cop_fv")
          .select(
            db.raw(`JSON_ARRAYAGG(JSON_OBJECT(
              "feature_id", cop_features_ms.feature_id,
              "feature_image", cop_features_ms.features_image
            ))`)
          )
          .join("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
          .whereRaw("cop_fv.variant_id = cop_variants.variant_id")
          .whereRaw(`cop_features_ms.features_name = "${transmission}"`)
          .as("transmission_data")
      )
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .join("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .where("cop_models.model_name", model)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .andWhere("cop_variants.status", 1)
      .limit(1);

    if (!models || models.length === 0) {
      throw new Error("data_not_found");
    }

    return models.map((item) => {
      const variantColors = item.variant_colors ? JSON.parse(item.variant_colors) : [];
      const displacementOrBatteryData = item.displacement_or_battery_cap_data ? JSON.parse(item.displacement_or_battery_cap_data) : [];
      const mileageOrRangeData = item.mileage_or_range_data ? JSON.parse(item.mileage_or_range_data) : [];
      const powerData = item.power_data ? JSON.parse(item.power_data) : [];
      const transmissionData = item.transmission_data ? JSON.parse(item.transmission_data) : [];

      const price = {
        min: item.min_ex_showroom_price,
        max: item.max_ex_showroom_price
      };

      return {
        ...item,
        variant_image: `${imagePath.brand}${item.brand_id}/${item.model_id}/${item.variant_id}/${item.variant_image}`,
        price,
        variant_colors: variantColors,
        displacement_or_battery_image: displacementOrBatteryData?.[0]
          ? `${imagePath.feature}${displacementOrBatteryData[0].feature_id}/${displacementOrBatteryData[0].feature_image}`
          : null,
        mileage_or_range_image: mileageOrRangeData?.[0]
          ? `${imagePath.feature}${mileageOrRangeData[0].feature_id}/${mileageOrRangeData[0].feature_image}`
          : null,
        power_image: powerData?.[0]
          ? `${imagePath.feature}${powerData[0].feature_id}/${powerData[0].feature_image}`
          : null,
        transmission_image: transmissionData?.[0]
          ? `${imagePath.feature}${transmissionData[0].feature_id}/${transmissionData[0].feature_image}`
          : null
      };
    });
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};




module.exports = {
  brands,
  models,
  variants,
  setPriceAlert,
  gallery,
  variantDetail,
  variantColors,
  variantPrice,
  variantSpecifications,
  variantKeyHighlights,
  variantDescription,
  variantFaq,
  modelDescription,
  similarModels,
  newsBlogsModelList,
  newsBlogsModelDescription
};
