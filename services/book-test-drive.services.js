const { add } = require("winston");
const {
  Features,
  ModelType,
  TestDriveStatus,
  SerialNumber,
} = require("../config/constant");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const e = require("express");
const imagePath = require("../config/image-path");

const preferences = async (brand, model) => {
  const query = () => {
    return db("cop_fv")
      .select(
        "cop_brands_ms.brand_name",
        "cop_models.model_name",
        db.raw(
          `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
          [imagePath.brand]
        ),
        "cop_models.image_alt",
        "cop_models.image_title",
        db.raw(
          `GROUP_CONCAT(DISTINCT 
        CASE 
          WHEN cop_models.model_type = ? THEN 'Electric' 
          WHEN features_name = ? THEN feature_value 
        END
      ) AS fuel,
      GROUP_CONCAT(DISTINCT 
        CASE 
          WHEN cop_models.model_type = ? THEN 'Automatic' 
          WHEN features_name = ? THEN feature_value 
        END
      ) AS transmission
        `,
          [ModelType.ev, Features.fuel, ModelType.ev, Features.transmission]
        )
      )
      .join(
        "cop_features_ms",
        "cop_features_ms.feature_id",
        "cop_fv.feature_id"
      )
      .join("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
      .join("cop_models", "cop_models.model_id", "cop_variants.model_id")
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .whereIn("features_name", [Features.fuel, Features.transmission])
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere("cop_models.slug", model)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .andWhere("cop_variants.status", 1)
      .groupBy("cop_models.model_id", "cop_variants.variant_id")
      .first();
  };
  try {
    const result = await query();
    const groupedFeatures = {
      brand_name: result.brand_name,
      model_name: result.model_name,
      variant_image: result.variant_image,
      image_alt: result.image_alt,
      image_title: result.image_title,
      fuel: result.fuel ? result.fuel.split(",") : [],
      transmission: result.transmission ? result.transmission.split(",") : [],
    };
    return groupedFeatures || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const bookTestDrive = async (
  auth,
  brand,
  model,
  name,
  email,
  address,
  location,
  fuel,
  transmission,
  estimated_purchase_date,
  dealer = 0
) => {
  const trx = await db.transaction();
  try {
    const existingTestDrive = await trx("cop_book_test_drives")
      .join(
        "cop_models",
        "cop_book_test_drives.model_id",
        "cop_models.model_id"
      )
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .where("customer_id", auth)
      .andWhere(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere("cop_models.slug", model)
      .whereIn("cop_book_test_drives.status", [
        TestDriveStatus.COMPLETED,
        TestDriveStatus.INPROGRESS,
      ])
      .first();

    if (existingTestDrive) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Test drive already booked!");
    }

    const ids = await trx("cop_models")
      .select("cop_models.model_id", "cop_brands_ms.brand_id")
      .join("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
      .where(db.raw(`CONCAT(cop_brands_ms.slug, '-cars')`), brand)
      .andWhere("cop_models.slug", model)
      .andWhere("cop_brands_ms.status", 1)
      .andWhere("cop_models.status", 1)
      .first();

    if (!ids) {
      throw new ApiError(httpStatus.NOT_FOUND, "Brand or model not found");
    }
    const { brand_id, model_id } = ids;

    const dealerId = dealer
      ? await trx("cop_dealer").select("id").where("uuid", dealer).first()
      : null;

    const serialNo = await trx("cop_serial_number")
      .select("count")
      .where("type", SerialNumber.TEST_DRIVE_TYPE)
      .first();

    if (!serialNo) {
      throw new Error("Serial number type not found");
    }

    const testDriveCount = serialNo.count + 1;
    const bookingId =
      SerialNumber.TEST_DRIVE_PREFIX + String(testDriveCount).padStart(6, "0");

    await trx("cop_book_test_drives").insert({
      name,
      email,
      fuel_types: fuel,
      transmission,
      address,
      estimated_purchase_date,
      location,
      customer_id: auth,
      brand_id,
      model_id,
      dealer_id: dealerId?.id ?? null,
      booking_id: bookingId,
      uuid: db.raw("UUID()"),
    });

    await trx("cop_serial_number")
      .where("type", SerialNumber.TEST_DRIVE_TYPE)
      .update({ count: testDriveCount });

    await trx.commit();
    return { message: "Test drive booked successfully", bookingId };
  } catch (err) {
    await trx.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { bookTestDrive, preferences };
