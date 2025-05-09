const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const imagePath = require("../config/image-path");
const { Banners } = require("../config/constant");
const { wishListModelSubQuery, getNewLaunchedDateRange } = require("../config/helper");

const headBanners = async () => {
  const query = () => {
    return db("cop_banners")
      .select(
        "cop_banners.uuid as id",
        "cop_banners.banner_heading",
        "cop_banners.banner_description",
        "cop_banners.image_alt",
        "cop_banners.image_title",
        db.raw(`CASE
        WHEN cop_banners.variant_id != '' OR cop_banners.variant_id IS NOT NULL THEN CONCAT(cop_brands_ms.slug, '-cars/', cop_models.slug, '/', cop_variants.slug)
        WHEN cop_banners.model_id != '' OR cop_banners.model_id IS NOT NULL THEN CONCAT(cop_brands_ms.slug, '-cars/', cop_models.slug)
        WHEN cop_banners.brand_id != '' OR cop_banners.brand_id IS NOT NULL THEN CONCAT(cop_brands_ms.slug, '-cars/')
        ELSE btn_link
      END as slug`),
        db.raw(
          `CONCAT(?, banner_id, '/',   cop_banners.banner_image) as banner_image`,
          [imagePath.banner]
        ),
        db.raw(
          `CONCAT(?, banner_id, '/',   cop_banners.banner_image_mob) as banner_image_mob`,
          [imagePath.banner]
        )
      )
      .join("cop_bc_ms as BC", "cop_banners.bc_id", "BC.bc_id")
      .leftJoin("cop_brands_ms", function (join) {
        join
          .on("cop_brands_ms.brand_id", "cop_banners.brand_id")
          .orOnNull("cop_brands_ms.brand_id");
      })
      .leftJoin("cop_models", function (join) {
        join
          .on("cop_models.model_id", "cop_banners.model_id")
          .orOnNull("cop_models.model_id");
      })
      .leftJoin("cop_variants", function (join) {
        join
          .on("cop_variants.variant_id", "cop_banners.variant_id")
          .orOnNull("cop_variants.variant_id");
      })
      .where("BC.bc_name", Banners.headBanner)
      .where("cop_banners.status", 1)
      .where(function () {
        this.where("cop_brands_ms.status", 1).orWhereNull(
          "cop_brands_ms.status"
        );
      })
      .where(function () {
        this.where("cop_models.status", 1).orWhereNull("cop_models.status");
      })
      .where(function () {
        this.where("cop_variants.status", 1).orWhereNull("cop_variants.status");
      })
      .orderBy("cop_banners.priority", "asc");
  };
  try {
    const result = await query();
    return result || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const upComingBanners = async () => {
  const query = () => {
    return db("cop_banners")
      .select(
        "cop_banners.uuid as id",
        "cop_banners.banner_heading",
        "cop_banners.image_alt",
        "cop_banners.image_title",
        db.raw(`CASE
        WHEN cop_banners.variant_id != '' OR cop_banners.variant_id IS NOT NULL THEN CONCAT('/',cop_brands_ms.slug, '-cars/', cop_models.slug, '/', cop_variants.slug)
        WHEN cop_banners.model_id != '' OR cop_banners.model_id IS NOT NULL THEN CONCAT('/',cop_brands_ms.slug, '-cars/', cop_models.slug)
        WHEN cop_banners.brand_id != '' OR cop_banners.brand_id IS NOT NULL THEN CONCAT('/',cop_brands_ms.slug, '-cars/')
        ELSE btn_link
      END as slug`),
        db.raw(
          `CONCAT(?, banner_id, '/',   cop_banners.banner_image) as banner_image`,
          [imagePath.banner]
        ),
        db.raw(
          `CONCAT(?, banner_id, '/',   cop_banners.banner_image_mob) as banner_image_mob`,
          [imagePath.banner]
        )
      )
      .join("cop_bc_ms as BC", "cop_banners.bc_id", "BC.bc_id")
      .leftJoin("cop_brands_ms", function (join) {
        join
          .on("cop_brands_ms.brand_id", "cop_banners.brand_id")
          .orOnNull("cop_brands_ms.brand_id");
      })
      .leftJoin("cop_models", function (join) {
        join
          .on("cop_models.model_id", "cop_banners.model_id")
          .orOnNull("cop_models.model_id");
      })
      .leftJoin("cop_variants", function (join) {
        join
          .on("cop_variants.variant_id", "cop_banners.variant_id")
          .orOnNull("cop_variants.variant_id");
      })
      .where("BC.bc_name", Banners.upcomingBanner)
      .where("cop_banners.status", 1)
      .where(function () {
        this.where("cop_brands_ms.status", 1).orWhereNull(
          "cop_brands_ms.status"
        );
      })
      .where(function () {
        this.where("cop_models.status", 1).orWhereNull("cop_models.status");
      })
      .where(function () {
        this.where("cop_variants.status", 1).orWhereNull("cop_variants.status");
      })
      .orderBy("cop_banners.priority", "asc");
  };
  try {
    const result = await query();
    return result || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const evBanners = async (cityId) => {
  const query = async () => {
    const minmaxQry = `
    (SELECT MIN(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as min_price,
    (SELECT MAX(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND  cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as max_price`;
    return db("cop_banners")
      .select(
        "cop_banners.uuid as id",
        db.raw(
          `CONCAT( cop_brands_ms.brand_name, ' ',   cop_models.model_name) as name`
        ),
        db.raw(minmaxQry),
        "cop_banners.image_alt",
        "cop_banners.image_title",
        db.raw(`CASE
      WHEN cop_banners.variant_id != '' OR cop_banners.variant_id IS NOT NULL THEN CONCAT(cop_brands_ms.slug, '-cars/', cop_models.slug, '/', cop_variants.slug)
      WHEN cop_banners.model_id != '' OR cop_banners.model_id IS NOT NULL THEN CONCAT(cop_brands_ms.slug, '-cars/', cop_models.slug)
      WHEN cop_banners.brand_id != '' OR cop_banners.brand_id IS NOT NULL THEN CONCAT(cop_brands_ms.slug, '-cars/')
      ELSE btn_link
    END as slug`),
        db.raw(
          `CONCAT(?, banner_id, '/',   cop_banners.banner_image) as banner_image`,
          [imagePath.banner]
        ),
        db.raw(
          `CONCAT(?, banner_id, '/',   cop_banners.banner_image_mob) as banner_image_mob`,
          [imagePath.banner]
        ),
        "MSD.model_engine as battery_capacity",
        "MSD.model_bhp as power",
        "MSD.model_mileage as range",
        "MSD.model_fuel as charging_time"
      )
      .join("cop_bc_ms as BC", "cop_banners.bc_id", "BC.bc_id")
      .leftJoin("cop_brands_ms", function (join) {
        join
          .on("cop_brands_ms.brand_id", "cop_banners.brand_id")
          .orOnNull("cop_brands_ms.brand_id");
      })
      .leftJoin("cop_models", function (join) {
        join
          .on("cop_models.model_id", "cop_banners.model_id")
          .orOnNull("cop_models.model_id");
      })
      .join("cop_msd as MSD", "cop_models.model_id", "MSD.model_id")
      .leftJoin("cop_variants", function (join) {
        join
          .on("cop_variants.variant_id", "cop_banners.variant_id")
          .orOnNull("cop_variants.variant_id");
      })
      .where("BC.bc_name", Banners.evBanner)
      .where("cop_banners.status", 1)
      .where(function () {
        this.where("cop_brands_ms.status", 1).orWhereNull(
          "cop_brands_ms.status"
        );
      })
      .where(function () {
        this.where("cop_models.status", 1).orWhereNull("cop_models.status");
      })
      .where(function () {
        this.where("cop_variants.status", 1).orWhereNull("cop_variants.status");
      })
      .orderBy("cop_banners.priority", "asc");
  };
  try {
    const result = await query();
    return result || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const carTypes = async () => {
  const query = () => {
    return db("cop_ct_ms")
      .select(
        "uuid as id",
        "ct_name",
        db.raw(`CONCAT(?, ct_id, '/', ct_image) as ct_image`, [
          imagePath.carTypes,
        ])
      )
      .orderBy("cop_ct_ms.priority", "asc");
  };
  try {
    const result = await query();
    return result || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const trendingCars = async (cityId, type, auth) => {
  const query = async () => {
    const minmaxQry = `
    (SELECT MIN(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as min_price,
    (SELECT MAX(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND  cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as max_price`;
    const cl_type = type == "Popular Cars" ? "Popular Cars" : "EV Cars";

    return db("cop_cl_data")
      .select(
        "cop_cl_data.uuid AS id",
        "cl_name",
        db.raw(minmaxQry),
        db.raw(
          'CONCAT(cop_brands_ms.brand_name, " ", cop_models.model_name) AS name'
        ),
        db.raw('CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug) AS slug'),
        db.raw(
          `CONCAT(?,cop_brands_ms.brand_id,'/', cop_models.model_id, '/thumb/', model_image) as model_image`,
          [imagePath.brand]
        ),
        "cop_models.image_alt",
        "cop_models.image_title",
        "trending_car_features.feature_json",
        db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
      )
      .innerJoin("cop_cl_ms", "cop_cl_data.cl_id", "cop_cl_ms.cl_id")
      .leftJoin(
        "cop_brands_ms",
        "cop_brands_ms.brand_id",
        "cop_cl_data.brand_id"
      )
      .leftJoin("cop_models", "cop_models.model_id", "cop_cl_data.model_id")
      .leftJoin(
        "trending_car_features ",
        "trending_car_features.model_id",
        "cop_models.model_id"
      )
      .where("cop_cl_ms.cl_name", cl_type)
      .where("cop_cl_data.status", 1)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1);
  };

  try {
    const result = await query();
    const cars = result.map((car) => ({
      ...car,
      feature_json: car.feature_json
        ? car.feature_json.split("##").map((feature) => {
            const parsedFeature = JSON.parse(feature);
            return {
              ...parsedFeature,
              features_image:
                imagePath.feature + `${parsedFeature.features_image}`,
            };
          })
        : [],
    }));
    return cars || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const newLaunchedCars = async (cityId, type, auth) => {
  const newLaunchedQuery = () => {
    const { startDate, endDate } = getNewLaunchedDateRange(6);
    const minmaxQry = `
    (SELECT MIN(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as min_price,
    (SELECT MAX(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND  cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as max_price`;

    return db("cop_models")
      .select(
        "cop_models.uuid AS id",
        db.raw("'New Launched Cars' as cl_name"),
        db.raw(minmaxQry),
        db.raw(
          'CONCAT(cop_brands_ms.brand_name, " ", cop_models.model_name) AS name'
        ),
        db.raw('CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug) AS slug'),
        db.raw(
          `CONCAT(?,cop_brands_ms.brand_id,'/', cop_models.model_id, '/thumb/', model_image) as model_image`,
          [imagePath.brand]
        ),
        "cop_models.image_alt",
        "cop_models.image_title",
        db.raw("Date(launch_date) as launch_date"),
        db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
      )
      .innerJoin("cop_cs_ms", "cop_models.cs_id", "cop_cs_ms.cs_id")
      .innerJoin(
        "cop_brands_ms",
        "cop_models.brand_id",
        "cop_brands_ms.brand_id"
      )
      .where("cop_cs_ms.cs_name", "Launched")
      .whereBetween("launch_date", [startDate, endDate])
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .orderBy("cop_models.launch_date","desc")
      .limit(10);
  };
  try {
    const newLaunchedResult = await newLaunchedQuery();

    return newLaunchedResult || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const carsByBudget = async (cityId, auth) => {
  const query = async () => {
    const minmaxQry = `
    (SELECT MIN(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as min_price,
    (SELECT MAX(ex_showroom_price) FROM cop_pe_ms inner join cop_variants on cop_variants.variant_id=cop_pe_ms.variant_id WHERE cop_variants.status=1 AND  cop_pe_ms.model_id = cop_models.model_id ${
      cityId ? `AND city_id = ${cityId}` : ""
    }) as max_price`;
    return db
      .select(
        "cop_models.uuid AS id",
        "name",
        db.raw(minmaxQry),
        "price_range",
        db.raw('CONCAT(cop_brands_ms.slug, "-cars/", cop_models.slug) AS slug'),
        db.raw(
          `CONCAT(?,cop_brands_ms.brand_id,'/', cop_models.model_id, '/thumb/', model_image) as model_image`,
          [imagePath.brand]
        ),
        "cop_models.image_alt",
        "cop_models.image_title",
        "feature_json",
        db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
      )
      .from("cars_by_budget as cb")
      .innerJoin("cop_models", "cop_models.model_id", "cb.model_id")
      .innerJoin(
        "cop_brands_ms ",
        "cop_brands_ms.brand_id",
        "cop_models.brand_id"
      )
      .leftJoin(
        "cars_by_budget_features ",
        "cars_by_budget_features.model_id",
        "cb.model_id"
      );
  };
  try {
    const result = await query();
    const cars = result.map((car) => ({
      ...car,
      feature_json: car.feature_json
        ? car.feature_json.split("##").map((feature) => {
            const parsedFeature = JSON.parse(feature);
            return {
              ...parsedFeature,
              features_image:
                imagePath.feature + `${parsedFeature.features_image}`,
            };
          })
        : [],
    }));
    const carsByPriceRange = {
      "2-10L": cars.filter((car) => car.price_range === "200000-1000000"),
      "10-25L": cars.filter((car) => car.price_range === "1000000-2500000"),
      "25-50L": cars.filter((car) => car.price_range === "2500000-5000000"),
      "50L-1Cr": cars.filter((car) => car.price_range === "5000000-10000000"),
      "1Cr+": cars.filter((car) => car.price_range === "10000000+"),
    };

    return carsByPriceRange || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = {
  headBanners,
  carTypes,
  upComingBanners,
  evBanners,
  trendingCars,
  carsByBudget,
  newLaunchedCars,
};
