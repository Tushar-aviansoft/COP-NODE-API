const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const db = require("../config/database");
const axios = require("axios");
const moment = require('moment');
const logger = require('../config/logger');
const transporter = require('../config/mailService');

const fuelPriceCreateOrUpdate = async () => {
    console.log('-> Running fuel price update or create cron...');
    try {
        const state_ids = [
            'gujarat',
            // 'maharashtra',
            // 'delhi',
            // 'karnataka',
            // 'tamil-nadu',
            // 'telangana',
            // 'uttar-pradesh',
        ];

        const fuelPriceKey = await db('cop_setting')
            .where('key', 'rapid_fuel_price')
            .andWhere('is_expired', 0)
            .andWhere('status', 1)
            .first();

        if (!fuelPriceKey) {
            // throw new ApiError(httpStatus.BAD_REQUEST, "No key found");
            logger.error("fuel-price-create-or-update => API key is not available");
        }

        const token_key = fuelPriceKey.value;
        const token_host = process.env.RAPID_FUEL_API_HOST;

        const withHeaders = {
            'x-rapidapi-host': token_host,
            'x-rapidapi-key': token_key,
        };

        // Loop through state_ids to fetch and store fuel prices
        for (const state_id of state_ids) {
            const baseUrl = `https://daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com/v1/fuel-prices/today/india/${state_id}/cities`;

            try {
                const response = await axios.get(baseUrl, { headers: withHeaders });

                if (response.status === 200) {
                    const responseData = response.data;
                    // return responseData;
                    await storeApiData(responseData);
                } else if (response.status === 429) {
                    // Mark current API key as expired
                    await db('cop_setting')
                        .where('key', 'rapid_fuel_price')
                        .andWhere('value', token_key)
                        .update({ is_expired: 1 });

                    // Fetch a new API key
                    const newFuelPriceKey = await db('cop_setting')
                        .where('key', 'rapid_fuel_price')
                        .andWhere('is_expired', 0)
                        .andWhere('status', 1)
                        .first();

                    if (!newFuelPriceKey) {
                        // throw new ApiError(httpStatus.BAD_REQUEST, "No valid API key available");
                        logger.error("fuel-price-create-or-update => New API key is not available");
                    }

                    const newTokenKey = newFuelPriceKey.value;
                    withHeaders['x-rapidapi-key'] = newTokenKey;

                    // Retry the request with the new API key
                    const retryResponse = await axios.get(baseUrl, { headers: withHeaders });
                    if (retryResponse.status === 200) {
                        const retryData = retryResponse.data;
                        await storeApiData(retryData);
                    } else {
                        // console.error('Retry failed for state:', state_id);
                        logger.error('fuel-price-create-or-update => Retry Failed to fetch data for state:' + state_id + ', Response:' + retryResponse.status)
                    }
                } else {
                    // console.error('Failed to fetch data for state:' + state_id + ', Response:' + response.status);
                    logger.error('fuel-price-create-or-update => Failed to fetch data for state:' + state_id + ', Response:' + response.status)
                }

                // Pause for 1 second to comply with API rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                // console.error('Error fetching data for state:', state_id, 'Error:', error.message);
                logger.error('fuel-price-create-or-update => Error fetching data for state:', state_id, 'Error:', error.message);
            }
        }

        // return ['Fuel prices updated successfully'];
        logger.info('fuel-price-create-or-update => Fuel prices updated successfully');
    } catch (err) {
        // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        logger.error('fuel-price-create-or-update => Internal server error' + err.message);
    }
}
// Function to store API data in the database
const storeApiData = async (response) => {
    try {
        const { stateId, stateName, countryId, countryName, cityPrices } = response;

        let country_id;
        const countryCheck = await db('cop_fuel_price_country_ms')
            .where('country_api_id', countryId)
            .andWhere('country_api_name', countryName)
            .andWhere('status', 1)
            .first();
        if (!countryCheck) {
            const countryInsert = await db('cop_fuel_price_country_ms').insert({
                country_api_id: countryId,
                country_api_name: countryName,
                uuid: db.raw("UUID()"),
            });
            country_id = countryInsert[0];
        } else {
            country_id = countryCheck.id;
        }

        let state_id;
        const stateCheck = await db('cop_fuel_price_state_ms')
            .where('state_api_id', stateId)
            .andWhere('state_api_name', stateName)
            .andWhere('fp_country_id', country_id)
            .andWhere('status', 1)
            .first();
        if (!stateCheck) {
            const stateInsert = await db('cop_fuel_price_state_ms').insert({
                state_api_id: stateId,
                state_api_name: stateName,
                fp_country_id: country_id,
                uuid: db.raw("UUID()"),
            });
            state_id = stateInsert[0];
        } else {
            state_id = stateCheck.id;
        }

        for (const city of cityPrices) {
            const { cityId, cityName, applicableOn, fuel } = city;

            let city_id;
            const cityCheck = await db('cop_fuel_price_city_ms')
                .where('city_api_id', cityId)
                .andWhere('city_api_name', cityName)
                .andWhere('fp_country_id', country_id)
                .andWhere('fp_state_id', state_id)
                .andWhere('status', 1)
                .first();
            if (!cityCheck) {
                const cityInsert = await db('cop_fuel_price_city_ms').insert({
                    city_api_id: cityId,
                    city_api_name: cityName,
                    fp_country_id: country_id,
                    fp_state_id: state_id,
                    uuid: db.raw("UUID()"),
                });
                city_id = cityInsert[0];
            } else {
                city_id = cityCheck.id;
            }

            for (const [fuelType, fuelData] of Object.entries(fuel)) {

                const fuelPriceCheck = await db('cop_fuel_price_data')
                    .where('fp_country_id', country_id)
                    .andWhere('fp_state_id', state_id)
                    .andWhere('fp_city_id', city_id)
                    .andWhere('fuel_type', fuelType)
                    .andWhere('as_on_date', applicableOn)
                    .first();
                if (!fuelPriceCheck) {
                    await db('cop_fuel_price_data').insert({
                        fp_country_id: country_id,
                        fp_state_id: state_id,
                        fp_city_id: city_id,
                        as_on_date: applicableOn,
                        fuel_type: fuelType,
                        retail_price: fuelData.retailPrice,
                        retail_price_change: fuelData.retailPriceChange,
                        retail_unit: fuelData.retailUnit,
                        currency: fuelData.currency,
                        retail_price_change_interval: fuelData.retailPriceChangeInterval,
                        uuid: db.raw("UUID()"),
                    });
                }
            }
        }
    } catch (error) {
        // console.error('Error storing API data:', error.message);
        // throw error;
        logger.error('fuel-price-create-or-update => Error storing API data:' + error.message);
    }
};

const settingApiKeyStatusUpdate = async () => {
    console.log('-> Running setting API key status update cron...');
    try {
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'); // Subtract 1 day
        const now = moment().format('YYYY-MM-DD HH:mm:ss'); // Current Date and Time

        const updateSetting = await db('cop_setting')
            .where('is_expired', 1)
            .andWhere('updated_at', '<=', yesterday)
            .update({
                is_expired: 0,
                updated_at: now
            });

        // return ["Status updated"];
        logger.info('setting-api-key-status-update => API Key status updated as 0 in Setting table');
    } catch (err) {
        // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        logger.error('setting-api-key-status-update => Internal server error' + err.message);
    }
}

const updateTollFuelUserCount = async () => {
    console.log('-> Running update toll-fuel calculator user count cron...');
    const trx = await db.transaction();
    try {
        const oneDayAgo = moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
        const now = moment().format('YYYY-MM-DD HH:mm:ss');

        // Update toll count
        const customers = await trx('cop_customers')
            .where('toll_date', '<', oneDayAgo)
            .pluck('customer_id');
        if (customers.length > 0) {
            await trx('cop_customers')
                .whereIn('customer_id', customers)
                .update({
                    toll_date: null,
                    toll_count: 0,
                    updated_at: now
                });

            logger.info('update-toll-fuel-user-count => Toll count updated as 0 successfully in applicable customers');
        }

        // Update fuel count
        const customerFuel = await trx('cop_customers')
            .where('fuel_date', '<', oneDayAgo)
            .pluck('customer_id');
        if (customerFuel.length > 0) {
            await trx('cop_customers')
                .whereIn('customer_id', customerFuel)
                .update({
                    fuel_date: null,
                    fuel_count: 0,
                    updated_at: now
                });

            logger.info('update-toll-fuel-user-count => Fuel count updated as 0 successfully in applicable customers');
        }

        await trx.commit();
    } catch (err) {
        // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        logger.error('update-toll-fuel-user-count => Internal server error' + err.message);
    }
}

const sendBirthdayWishes = async () => {
    console.log('-> Running send birthday wishes cron...');
    try {
        const today = moment().format("MM-DD");

        const customers = await db("cop_customers")
            .whereRaw('DATE_FORMAT(dob, "%m-%d") = ?', [today])
            .select("*");

        for (const customer of customers) {

            const htmlTemplate = `
                <!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Birthday Wishes</title>
                    <style>
                        body {
                            font-family: 'Arial, sans-serif';
                            margin: 0;
                            padding: 0;
                            background-color: #f2f2f2;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background-color: #ffbb33;
                            padding: 20px;
                            text-align: center;
                        }
                        .header img {
                            max-width: 100px;
                        }
                        .header h1 {
                            color: #ffffff;
                            margin: 10px 0 0;
                        }
                        .content {
                            padding: 20px;
                            text-align: center;
                        }
                        .content h2 {
                            color: #333333;
                        }
                        .content p {
                            color: #666666;
                            line-height: 1.5;
                        }
                        .content .button {
                            display: inline-block;
                            margin: 20px 0;
                            padding: 10px 20px;
                            background-color: #ffbb33;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                        .footer {
                            background-color: #f7f7f7;
                            padding: 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #999999;
                        }
                    </style>
                </head>

                <body>
                    <div class="container">

                        <div class="content">
                            <h2>Happy Birthday, ${customer.first_name} ${customer.last_name},</h2>
                            <p>
                                Wishes for your special day! May your year ahead be reliable, adventurous, and joyful, just like your dream car. Enjoy your day and drive safely.
                            </p>
                        </div>
                        <div class="footer">
                            Best Wishes,
                            <a href="https://caronphone.com">caronphone</a>
                        </div>
                    </div>
                </body>

                </html>
            `;

            try {
                await transporter.sendMail({
                    from: process.env.MAIL_USERNAME,
                    to: customer.email,
                    subject: "Gear up for an amazing birthday",
                    html: htmlTemplate,
                });
                logger.info(`send-birthday-wishes => Birthday email sent to ${customer.email}`);
            } catch (error) {
                logger.error(`send-birthday-wishes => Error sending email to ${customer.email}: ${error.message}`);
            }
        }
    } catch (err) {
        // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        logger.error('send-birthday-wishes => Internal server error' + err.message);
    }
}

const sendAnniversaryWishes = async () => {
    console.log('-> Running send anniversary wishes cron...');
    try {
        const today = moment().format("MM-DD");

        const customers = await db("cop_customers")
            .whereRaw('DATE_FORMAT(anniversary_date, "%m-%d") = ?', [today])
            .select("*");

        for (const customer of customers) {

            const htmlTemplate = `
                <!DOCTYPE html>
                    <html lang="en">

                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Anniversary Wishes</title>
                        <style>
                            body {
                                font-family: 'Arial, sans-serif';
                                margin: 0;
                                padding: 0;
                                background-color: #f2f2f2;
                            }
                            .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }
                            .header {
                                background-color: #4CAF50;
                                padding: 20px;
                                text-align: center;
                            }
                            .header img {
                                max-width: 100px;
                            }
                            .header h1 {
                                color: #ffffff;
                                margin: 10px 0 0;
                            }
                            .content {
                                padding: 20px;
                                text-align: center;
                            }
                            .content h2 {
                                color: #333333;
                            }
                            .content p {
                                color: #666666;
                                line-height: 1.5;
                            }
                            .content .button {
                                display: inline-block;
                                margin: 20px 0;
                                padding: 10px 20px;
                                background-color: #4CAF50;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 5px;
                            }
                            .footer {
                                background-color: #f7f7f7;
                                padding: 20px;
                                text-align: center;
                                font-size: 12px;
                                color: #999999;
                            }
                        </style>
                    </head>

                    <body>
                        <div class="container">
                            <div class="content">
                                <h2>Dear ${customer.first_name} ${customer.last_name},</h2>
                                <p>
                                    Wishing you both a very Happy Anniversary!
                                    May your journey together be as exciting and fulfilling as a road trip to your favorite destinations.
                                </p>
                            </div>
                            <div class="footer">
                                Best Wishes,
                                <a href="https://caronphone.com">caronphone</a>
                            </div>
                        </div>
                    </body>

                    </html>
            `;

            try {
                await transporter.sendMail({
                    from: process.env.MAIL_USERNAME,
                    to: customer.email,
                    subject: "Celebrating your togetherness",
                    html: htmlTemplate,
                });
                logger.info(`send-anniversary-wishes => Anniversary email sent to ${customer.email}`);
            } catch (error) {
                logger.error(`send-anniversary-wishes => Error sending email to ${customer.email}: ${error.message}`);
            }
        }
    } catch (err) {
        // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        logger.error('send-anniversary-wishes => Internal server error' + err.message);
    }
}

module.exports = {
    fuelPriceCreateOrUpdate,
    settingApiKeyStatusUpdate,
    updateTollFuelUserCount,
    sendBirthdayWishes,
    sendAnniversaryWishes
}