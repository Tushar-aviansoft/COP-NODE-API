const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const imagePath = require("../config/image-path");
const { TestDriveStatus } = require("../config/constant");

const userDetail = async (auth) => {
  const basicDetailQuery = db("cop_customers")
    .select(
      db.raw("uuid as id"),
      db.raw("first_name as name"),
      "email",
      "address_1",
      "address_2",
      "profile_pic",
      db.raw("CONCAT('+',contact_no) as contact_no"),
      "dob",
      "anniversary_date"
    )
    .where("customer_id", auth)
    .first();
  const testDrivesQuery = db("cop_book_test_drives")
    .select(
      db.raw(`CONCAT(brand_name," ",cop_models.model_name) as name`),
      "cop_book_test_drives.fuel_types",
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' , cop_models.model_image) as model_image`,
        [imagePath.brand]
      ),
      "cop_models.image_alt",
      "cop_models.image_title",
      "cop_book_test_drives.booking_id",
      db.raw(
        `CASE 
         WHEN cop_book_test_drives.status = 2 THEN '${TestDriveStatus.COMPLETED}' 
         WHEN cop_book_test_drives.status = 1 THEN '${TestDriveStatus.INPROGRESS}' 
         ELSE 'Cancelled' 
       END AS booking_status`
      )
    )
    .join("cop_models", "cop_models.model_id", "cop_book_test_drives.model_id")
    .join(
      "cop_brands_ms",
      "cop_brands_ms.brand_id",
      "cop_book_test_drives.brand_id"
    )
    .where("customer_id", auth);
  try {
    if (auth) {
      const [basicDetails, testDrives] = await Promise.all([
        basicDetailQuery,
        testDrivesQuery,
      ]);

      return { basicDetails: basicDetails, testDrives: testDrives };
    }
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
const updateBasicDetail = async (auth, name, email, dob, anniversary_date) => {
  try {
    const existingEmail = await db("cop_customers")
      .where("email", email)
      .andWhere("customer_id", "<>", auth)
      .first();

    if (existingEmail) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email is already in use.");
    }

    const dobDate = new Date(dob);
    const anniversaryDate = new Date(anniversary_date);
    if (anniversaryDate < dobDate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Anniversary date cannot be later than the date of birth."
      );
    }
    await db("cop_customers")
      .update({
        first_name: name,
        email,
        dob: dob ? new Date(dob) : null,
        anniversary_date: anniversary_date ? new Date(anniversary_date) : null,
      })
      .where("customer_id", auth);
    const updatedDetails = await db("cop_customers")
      .select(
        db.raw("uuid as id"),
        db.raw("first_name as name"),
        "email",
        "address_1",
        "address_2",
        "profile_pic",
        db.raw("CONCAT('+',contact_no) as contact_no"),
        "dob",
        "anniversary_date"
      )
      .where("customer_id", auth)
      .first();
    return { message: "Updated!", basicDetails: updatedDetails };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const updateAddress = async (auth, address_1, address_2) => {
  try {
    await db("cop_customers")
      .update({
        address_1,
        address_2,
      })
      .where("customer_id", auth);

    const updatedAddress = {
      'address_1': address_1,
      'address_2': address_2
    };
    return { message: "Address has been updated", updatedAddress: updatedAddress };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

const updateProfile = async (auth, profile_pic) => {
  try {
    await db("cop_customers")
      .update({
        profile_pic,
      })
      .where("customer_id", auth);

    const updatedProfilePic = {
      "profile_pic": profile_pic
    }
    return { message: "Profile picture has been updated", updatedProfilePic: updatedProfilePic };
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = {
  userDetail,
  updateBasicDetail,
  updateAddress,
  updateProfile,
};
