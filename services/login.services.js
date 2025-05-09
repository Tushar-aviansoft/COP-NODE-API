const { default: axios } = require("axios");
const jwt = require("jsonwebtoken");
const { API_URL } = require("../config/constant");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const crypto = require('crypto');
const moment = require('moment');


function generateOTP() {
  const randomBytes = crypto.randomBytes(3);
  const otp = parseInt(randomBytes.toString('hex'), 16) % 900000 + 100000;
  return otp;
}

const sendOtp = async (mobile) => {
  try {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Valid mobile number is required");
    }

    const mobileNumber = "91" + mobile;

    // CONFIG: Fetch SMS API credentials from .env
    const {
      TEXTGURU_USERNAME: username,
      TEXTGURU_PASSWORD: password,
      TEXTGURU_SOURCE: source,
      TEXTGURU_TEMPLATE_ID: templateId,
      TEXTGURU_MESSAGE: messageTemplate
    } = process.env;

    if (!username || !password || !source || !templateId || !messageTemplate) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "SMS API credentials are not configured properly");
    }

    const otp = generateOTP(); // You can use crypto or custom logic
    const message = messageTemplate.replace("{OTP}", otp);

    const apiUrl = `${API_URL.send_otp}?username=${username}` +
      `&password=${password}` +
      `&source=${source}` +
      `&dmobile=${mobileNumber}` +
      `&dlttempid=${templateId}` +
      `&message=${encodeURIComponent(message)}`;



    const expiresAt = moment().utc().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');


    // Save OTP log
    await db("cop_otp_log_details").insert({
      email_or_mobile: mobileNumber,
      otp: otp,
      expire_at: expiresAt,
      status: "0",
    });

    // Send OTP via SMS
    const response = await axios.get(apiUrl);

    if (response.status === 200) {
      return {
        statusCode: httpStatus.OK,
        message: "OTP sent successfully!",
      };
    } else {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP. Please try again."
      );
    }
  } catch (err) {
    console.error("Error sending OTP:", err);
    throw new ApiError(
      err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
      err.message || "An error occurred while sending OTP"
    );
  }
};

const verifyOtp = async (mobile, otp) => {
  try {
    if (!mobile) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Mobile number is required");
    }

    const mobileNumber = "91" + mobile;
    const currentTime = moment().utc();
    const tenMinutesLater = moment().add(10, 'minutes').utc();

    // Step 1: Verify OTP and check if it's still valid within 10 minutes window
    const verify_otp = await db("cop_otp_log_details")
      .where({
        email_or_mobile: mobileNumber,
        otp: otp
      })
      .andWhere('expire_at', '>', currentTime.format('YYYY-MM-DD HH:mm:ss'))
      .andWhere('expire_at', '<=', tenMinutesLater.format('YYYY-MM-DD HH:mm:ss'))
      .first();

    if (!verify_otp) {
      console.log("Invalid or expired OTP");
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
    }

    // Step 2: Update the OTP status to 'verified'
    await db('cop_otp_log_details')
      .where({
        email_or_mobile: mobileNumber,
        status: "0"
      })
      .update({ status: "1" });

    let token = "";
    let customerData = null;

    // Step 4: Get customer data to generate token
    const existingRecord = await db("cop_customers")
      .select("uuid", "first_name", "profile_pic", "toll_count", "fuel_count")
      .where("contact_no", mobileNumber)
      .first();

    if (!existingRecord) {
      // Step 3: Insert customer into the cop_customers table
      const [insertedId] = await db('cop_customers')
        .insert({
          contact_no: mobileNumber,
          is_verified: 1,
          created_at: new Date()
        });

      customerData = await db('cop_customers')
        .where({ customer_id: insertedId })
        .first();

      if (!customerData) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve newly inserted customer.");
      }
    } else {
      customerData = existingRecord;
    }

    // Step 5: Generate JWT token
    token = jwt.sign(
      { uuid: customerData.uuid },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    if (!token) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Token generation failed.");
    }

    return {
      token: token,
      sign_up: existingRecord ? 0 : 1, // 1 for new signup, 0 for existing
      name: customerData.first_name ?? "",
      contact_no: mobileNumber,
      profile_pic: customerData.profile_pic ?? "",
      toll_count: customerData.toll_count ?? null,
      fuel_count: customerData.fuel_count ?? null,
      statusCode: httpStatus.OK,
    };
  } catch (err) {
    console.error("Error in verifyOtp:", err.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};


const resendOtp = async (mobile) => {
  try {
    if (mobile) {
      const mobileNumber = "91" + mobile;

      // Check if the record exists in the database
      const existingRecord = await db("cop_customers")
        .select("contact_no")
        .where("contact_no", mobileNumber)
        .first();

      const otp = generateOTP();

      const username = process.env.TEXTGURU_USERNAME;
      const password = process.env.TEXTGURU_PASSWORD;
      const source = process.env.TEXTGURU_SOURCE;
      const dmobile = mobileNumber;
      const templateId = process.env.TEXTGURU_TEMPLATE_ID;
      const messageTemplate = process.env.TEXTGURU_MESSAGE;
      const message = messageTemplate.replace("{OTP}", otp);

      const apiUrl = `${API_URL.send_otp}?username=${username}` +
        `&password=${password}` +
        `&source=${source}` +
        `&dmobile=${dmobile}` +
        `&dlttempid=${templateId}` +
        `&message=${encodeURIComponent(message)}`;

      // Log the OTP to the database if this is a new mobile number
      if (!existingRecord) {
        await db("cop_otp_log_details").where({
          email_or_mobile: mobileNumber,
          status: "0"
        }).update({ otp: otp, });
      }

      // Send the OTP
      const response = await axios.get(apiUrl);

      if (response.status === 200) {
        return {
          statusCode: httpStatus.OK,
          message: "OTP resent successfully!",
        };
      } else {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to resend OTP. Please try again."
        );
      }
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Mobile number is required");
    }
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = { sendOtp, verifyOtp, resendOtp };
