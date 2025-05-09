const {
  CarStages,
  BudgetList,
  launchMonthList,
} = require("../config/constant");
const db = require("../config/database");
const {
  getNewLaunchedDateRange,
  wishListModelSubQuery,
} = require("../config/helper");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const models = async (
  brands,
  carTypes,
  launchMonth,
  minPrice,
  maxPrice,
  sort,
  cityId,
  page = 1,
  limit = 10,
  auth
) => {
  const offset = (page - 1) * limit;
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const { startDate, endDate } = getNewLaunchedDateRange(launchMonth);
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
      "cop_models.launch_date",
      db.raw(`${wishListModelSubQuery(auth)} as wishlist`)
    )
    .join("cop_variants", "cop_models.model_id", "=", "cop_variants.model_id")
    .join("cop_brands_ms", "cop_brands_ms.brand_id", "=", "cop_models.brand_id")
    .leftJoin(
      db("cop_pe_ms")
        .select("model_id")
        .min("ex_showroom_price as min_price")
        .where(cityId ? { city_id: cityId } : {})
        .groupBy("model_id")
        .as("min_price_data"),
      "min_price_data.model_id",
      "cop_models.model_id"
    )
    .leftJoin(
      db("cop_pe_ms")
        .select("model_id")
        .max("ex_showroom_price as max_price")
        .where(cityId ? { city_id: cityId } : {})
        .groupBy("model_id")
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
    .whereBetween("cop_models.launch_date", [startDate, endDate])
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .andWhere("cop_cs_ms.cs_name", CarStages.launched)
    .distinct("cop_models.model_id")
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
      if (sort == "DESC") {
        queryBuilder.orderBy("max_price", "DESC");
      } else {
        queryBuilder.orderBy("min_price", "ASC");
      }
    });

  try {
    const totalQuery = modelQuery
      .clone()
      .clearSelect()
      .clearOrder()
      .countDistinct({ total: "cop_models.model_id" })
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
const launchMonth = async (brands, carTypes, minPrice, maxPrice) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const caseConditions = launchMonthList
    .map(
      (month) => `
    WHEN cop_models.launch_date >= DATE_SUB(CURDATE(), INTERVAL ${month} MONTH) THEN '${month}'`
    )
    .join(" ");
  const query = () => {
    return db("cop_models")
      .select(
        db.raw(`
        CASE
          ${caseConditions}
        END AS period_group`),
        db.raw("COUNT(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_variants", "cop_variants.model_id", "cop_models.model_id")
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where(
        "cop_models.launch_date",
        ">=",
        db.raw("DATE_SUB(CURDATE(), INTERVAL 1 YEAR)")
      )
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .groupBy("period_group")
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
      })
      .orderBy("period_group", "DESC");
  };
  try {
    const data = await query();
    const periodModelCounts = launchMonthList.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});
    data.forEach((value) => {
      const periodGroup = parseInt(value.period_group, 10);
      if (periodModelCounts.hasOwnProperty(periodGroup)) {
        periodModelCounts[periodGroup] = value.count;
      }
    });
    for (let i = 1; i < launchMonthList.length; i++) {
      const current = launchMonthList[i];
      const previous = launchMonthList[i - 1];
      periodModelCounts[current] += periodModelCounts[previous];
    }

    return periodModelCounts || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const budget = async (brands, carTypes, launchMonth) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const { startDate, endDate } = getNewLaunchedDateRange(launchMonth);

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
      .whereBetween("cop_models.launch_date", [startDate, endDate])
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
const brands = async (carTypes, launchMonth, minPrice, maxPrice) => {
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const { startDate, endDate } = getNewLaunchedDateRange(launchMonth);
  const query = () => {
    return db("cop_models")
      .select(
        "cop_brands_ms.brand_name as name",
        db.raw("COUNT(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_variants", "cop_variants.model_id", "cop_models.model_id")

      .whereBetween("cop_models.launch_date", [startDate, endDate])
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
const carTypes = async (brands, launchMonth, minPrice, maxPrice) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const { startDate, endDate } = getNewLaunchedDateRange(launchMonth);
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
      .whereIn("cop_variants.variant_id", function () {
        this.select("cop_pe_ms.variant_id")
          .from("cop_pe_ms")
          .whereBetween("cop_pe_ms.ex_showroom_price", [minPrice, maxPrice]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .where("cop_variants.status", 1)
      .whereBetween("cop_models.launch_date", [startDate, endDate])
      .groupBy("cop_ct_ms.ct_id", "cop_ct_ms.ct_image", "cop_ct_ms.ct_name")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
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

module.exports = {
  launchMonth,
  budget,
  brands,
  carTypes,
  models,
};
