const {
  CarStages,
  BudgetList,
  MIN_PRICE,
  MAX_PRICE,
  launchMonthList,
} = require("../config/constant");
const db = require("../config/database");
const { getUpcomingDateRange } = require("../config/helper");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
 
const models = async (
  brands,
  carTypes,
  launchMonth,
  budget,
  page = 1,
  limit = 10,
  brand,
  model
) => {
 
  const offset = (page - 1) * limit;
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const budgetArray = budget.split(",").map((item) => item.trim());
 
  const { startDate, endDate } = getUpcomingDateRange(launchMonth);
  console.log("🚀 ~ startDate, endDate:", startDate, endDate)
 
 
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
    "cop_models.min_price",
    "cop_models.max_price",
    "cop_models.launch_date",
    "cop_models.model_id",
    "cop_brands_ms.brand_name",
    "cop_models.model_name"
  )
  .join("cop_brands_ms", "cop_brands_ms.brand_id", "=", "cop_models.brand_id")
  .join("cop_cs_ms", "cop_cs_ms.cs_id", "=", "cop_models.cs_id")
  .where(function () {
    this.whereBetween("cop_models.min_price", [MIN_PRICE, MAX_PRICE])
      .orWhereBetween("cop_models.max_price", [MIN_PRICE, MAX_PRICE]);
  })
  .andWhere("cop_brands_ms.status", 1)
  .andWhere("cop_models.status", 1)
  .andWhere("cop_cs_ms.cs_name", CarStages.upcoming)
  .distinct("cop_models.model_id")
  .orderBy("launch_date", "asc")
  .modify(function (queryBuilder) {
    if (brand && model) {
      queryBuilder
        .where(db.raw("CONCAT(cop_brands_ms.slug, '-cars')"), brand)
        .andWhere("cop_models.slug", model);
    } else {
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
      if (budget) {
        const selectedPriceRanges = budgetArray.map((label) => {
          return Object.keys(BudgetList).find(
            (key) => BudgetList[key] === label
          );
        });
 
        queryBuilder.andWhere(function () {
          selectedPriceRanges.forEach((range) => {
            const [min, max] = range.split(" to ").map(Number);
            this.orWhere(function () {
              this.whereBetween("cop_models.min_price", [min, max])
                .orWhereBetween("cop_models.max_price", [min, max]);
            });
          });
        });
      }
 
      // Moved launch date filter inside the else block
      queryBuilder.whereBetween("cop_models.launch_date", [startDate, endDate]);
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
 
    const formatDate = (dateString) => {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateString));
    };
 
    const formattedResults = results.map((item) => ({
      ...item,
      launch_date: formatDate(item.launch_date),
    }));
 
    const totalRecords = parseInt(totalResult?.total || 0, 10);
    const totalPages = Math.ceil(totalRecords / limit);
 
    if (brand && model) {
      return {
        data: results[0]
          ? {
              ...results[0],
              launch_date: formatDate(results[0].launch_date),
            }
          : null,
      };
    }
 
    return {
      data: formattedResults || [],
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
 
 
const launchMonth = async () => {
  try {
    return launchMonthList;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const budget = async (brands, carTypes, launchMonth) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const { startDate, endDate } = getUpcomingDateRange(launchMonth);
 
  const caseStatements = Object.entries(BudgetList)
    .map(([range, label]) => {
      const [min, max] = range.split(" to ").map(Number);
      return `COUNT(DISTINCT IF(cop_models.min_price BETWEEN ${min} AND ${max} OR cop_models.max_price BETWEEN ${min} AND ${max}, cop_models.model_id, NULL)) AS '${label}'`;
    })
    .join(", ");
 
  const query = () => {
    return db("cop_models")
      .select(db.raw(`  ${caseStatements}`))
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_cs_ms", "cop_cs_ms.cs_id", "=", "cop_models.cs_id")
      .whereBetween("cop_models.launch_date", [startDate, endDate])
      .where(function () {
        this.whereBetween("cop_models.min_price", [
          MIN_PRICE,
          MAX_PRICE,
        ]).orWhereBetween("cop_models.max_price", [MIN_PRICE, MAX_PRICE]);
      })
      .where("cop_brands_ms.status", 1)
      .where("cop_models.status", 1)
      .andWhere("cop_cs_ms.cs_name", CarStages.upcoming)
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
      });
  };
  try {
    const data = await query();
    const formattedResults = Object.entries(BudgetList)
      .map(([range, label]) => {
        return {
          name: label,
          count: data[0][label] || 0,
        };
      })
      .filter((result) => result.count > 0);
    return formattedResults || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const brands = async (carTypes, launchMonth, budget) => {
  const carTypesArray = carTypes.split(",").map((item) => item.trim());
  const budgetArray = budget.split(",").map((item) => item.trim());
  const { startDate, endDate } = getUpcomingDateRange(launchMonth);
  const query = () => {
    return db("cop_models")
      .select(
        "cop_brands_ms.brand_name as name",
        db.raw("COUNT(DISTINCT cop_models.model_id) as count")
      )
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_cs_ms", "cop_cs_ms.cs_id", "=", "cop_models.cs_id")
      .whereBetween("cop_models.launch_date", [startDate, endDate])
      .where(function () {
        this.whereBetween("cop_models.min_price", [
          MIN_PRICE,
          MAX_PRICE,
        ]).orWhereBetween("cop_models.max_price", [MIN_PRICE, MAX_PRICE]);
      })
      .andWhere("cop_cs_ms.cs_name", CarStages.upcoming)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
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
        if (budget) {
          const selectedPriceRanges = budgetArray.map((label) => {
            return Object.keys(BudgetList).find(
              (key) => BudgetList[key] === label
            );
          });
 
          queryBuilder.andWhere(function () {
            selectedPriceRanges.forEach((range) => {
              const [min, max] = range.split(" to ").map(Number);
              this.orWhere(function () {
                this.whereBetween("cop_models.min_price", [
                  min,
                  max,
                ]).orWhereBetween("cop_models.max_price", [min, max]);
              });
            });
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
 
const carTypes = async (brands, launchMonth, budget) => {
  const brandsArray = brands.split(",").map((item) => item.trim());
  const budgetArray = budget.split(",").map((item) => item.trim());
  const { startDate, endDate } = getUpcomingDateRange(launchMonth);
  const query = () => {
    return db("cop_models")
      .select(
        "cop_ct_ms.ct_name as name",
        db.raw("GROUP_CONCAT(DISTINCT cop_models.model_name) as hdbc"),
        db.raw("count(DISTINCT cop_models.model_id) as count"),
        db.raw(`CONCAT(?,cop_ct_ms.ct_id,'/',cop_ct_ms.ct_image) as image`, [
          imagePath.carTypes,
        ])
      )
      .join("cop_brands_ms", "cop_models.brand_id", "cop_brands_ms.brand_id")
      .join("cop_ct_ms", "cop_ct_ms.ct_id", "=", "cop_models.ct_id")
      .join("cop_cs_ms", "cop_cs_ms.cs_id", "=", "cop_models.cs_id")
      .whereBetween("cop_models.launch_date", [startDate, endDate])
      .where(function () {
        this.whereBetween("cop_models.min_price", [
          MIN_PRICE,
          MAX_PRICE,
        ]).orWhereBetween("cop_models.max_price", [MIN_PRICE, MAX_PRICE]);
      })
      .andWhere("cop_cs_ms.cs_name", CarStages.upcoming)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .groupBy("cop_ct_ms.ct_id", "cop_ct_ms.ct_image", "cop_ct_ms.ct_name")
      .havingRaw("count > 0")
      .modify(function (queryBuilder) {
        if (brands.length > 0) {
          queryBuilder.whereIn("cop_brands_ms.brand_name", brandsArray);
        }
        if (budget) {
          const selectedPriceRanges = budgetArray.map((label) => {
            return Object.keys(BudgetList).find(
              (key) => BudgetList[key] === label
            );
          });
 
          queryBuilder.andWhere(function () {
            selectedPriceRanges.forEach((range) => {
              const [min, max] = range.split(" to ").map(Number);
              this.orWhere(function () {
                this.whereBetween("cop_models.min_price", [
                  min,
                  max,
                ]).orWhereBetween("cop_models.max_price", [min, max]);
              });
            });
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
 
 
 
 
module.exports = {
  launchMonth,
  budget,
  brands,
  carTypes,
  models,
};
 