const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const moment = require('moment');

const ratingAndReviews = async (brand, model, limit, auth) => {
  const ratingQuery = db("cop_reviews")
    .select(
      "cop_reviews.uuid as id",
      db.raw("CONCAT(brand_name, ' ', cop_models.model_name) AS model_name"),
      "first_name as name",
      "profile_pic",
      "cop_reviews.rating",
      "cop_reviews.review",
      "cop_reviews.created_at as date",
      db.raw(`COUNT(cop_review_like.id) as totalLikes`),
      db.raw(`(SELECT 
              CASE 
                WHEN COUNT(*) > 0 THEN true ELSE false 
              END 
            FROM cop_review_like 
            WHERE cop_review_like.liked_by = ? 
            AND cop_review_like.review_id = cop_reviews.id) as review_like`,
        [auth]
      )
    )
    .innerJoin("cop_models", "cop_models.model_id", "cop_reviews.model_id")
    .leftJoin("cop_review_like", "cop_review_like.review_id", "cop_reviews.id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .innerJoin(
      "cop_customers",
      "cop_customers.customer_id",
      "cop_reviews.created_by"
    )

    .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_reviews.status", 1)
    .groupBy(
      // "cop_reviews.id",
      "cop_reviews.id",
      "cop_reviews.uuid",
      "cop_models.model_name",
      "cop_customers.first_name",
      "cop_customers.profile_pic",
      "cop_reviews.rating",
      "cop_reviews.review",
      "cop_brands_ms.brand_name"
    )
    .orderBy("cop_reviews.rating", "desc");
  if (limit) {
    ratingQuery.limit(limit);
  }
  const userReviewExists = await db("cop_reviews")
    .innerJoin("cop_models", "cop_models.model_id", "cop_reviews.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .where("cop_reviews.created_by", auth)
    .andWhere("cop_models.slug", model)
    .andWhere(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .first();

  try {
    const [data, user_review_exist] = await Promise.all([
      ratingQuery,
      auth ? userReviewExists : Promise.resolve(null),
    ]);
    const ratingCount = { "5.0": 0, "4.0": 0, "3.0": 0, "2.0": 0, "1.0": 0 };
    let totalRating = 0;
    let weightedSum = 0;
    data.forEach((review) => {
      const ratingStr = review.rating.toFixed(1);
      ratingCount[ratingStr] = (ratingCount[ratingStr] || 0) + 1;
      totalRating += 1;
      weightedSum += review.rating;
      review.date = moment(review.date).format("DD MMM YYYY");
    });
    const averageRating = totalRating
      ? (weightedSum / totalRating).toFixed(1)
      : "0.0";

    return {
      user_review_exist: user_review_exist ? 1 : 0,
      reviews: data,
      ratingCount,
      totalRating,
      averageRating,
    };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const createReview = async (brand, model, rating, review, auth) => {
  try {
    const ids = await db("cop_models")
      .select("cop_brands_ms.brand_id", "cop_models.model_id")
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere("cop_models.slug", model)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .first();
    if (!ids) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Brand or model not found");
    }
    const { brand_id, model_id } = ids;
    const existingReview = await db("cop_reviews")
      .where({ brand_id, model_id, created_by: auth })
      .first();

    if (existingReview) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Review already exists for this brand and model."
      );
    }
    await db("cop_reviews").insert({
      brand_id,
      model_id,
      rating,
      review,
      created_by: auth,
      uuid: db.raw("UUID()"),
    });
    return {
      message: "Review added successfully",
    };
  } catch (err) {
    throw new ApiError(err.statusCode, err.message);
  }
};
const likeReview = async (reviewId, auth) => {
  try {
    const existingRecord = await db("cop_review_like")
      .select("cop_review_like.id")
      .join("cop_reviews", "cop_reviews.id", "cop_review_like.review_id")
      .where("cop_reviews.uuid", reviewId)
      .andWhere("liked_by", auth)
      .first();
    const uuid = await db("cop_reviews").where("uuid", reviewId).first();
    if (uuid) {
      if (existingRecord) {
        await db("cop_review_like").where("id", existingRecord.id).del();
        return { message: "Liked deleted successfully" };
      } else {
        await db("cop_review_like").insert({
          review_id: (
            await db("cop_reviews").select("id").where("uuid", reviewId).first()
          ).id,
          liked_by: auth,
          uuid: db.raw("UUID()"),
        });
        return { message: "Liked  successfully" };
      }
    } else {
      return { message: "Review not found" };
    }
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = { createReview, likeReview, ratingAndReviews };
