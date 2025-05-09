const axios = require('axios');
const moment = require('moment');
const ApiError = require('../utils/ApiError');
const httpStatus = require("http-status");
const db = require('../config/database');


const tollTaxResponse = async (
    from_address, from_latitude, from_longitude, from_city_name,
    from_country, from_state_code, from_state_name, from_uri,
    to_address, to_latitude, to_longitude, to_city_name,
    to_country, to_state_code, to_state_name, to_uri,
    page_name, auth, cityUuidFromCookie
) => {
    try {
        if (!auth) {
            throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authenticated.");
        }

        // 1. Update Toll/Fuel Counters
        const userCounts = await db('cop_customers')
            .select('toll_count', 'fuel_count')
            .where('customer_id', auth)
            .first();

        if (page_name === 'toll-calculator') {
            await db('cop_customers')
                .where('customer_id', auth)
                .update({
                    toll_count: userCounts.toll_count + 1,
                    toll_date: moment().format('YYYY-MM-DD HH:mm:ss')
                });
        }

        if (page_name === 'fuel-calculator') {
            await db('cop_customers')
                .where('customer_id', auth)
                .update({
                    fuel_count: userCounts.fuel_count + 1,
                    fuel_date: moment().format('YYYY-MM-DD HH:mm:ss')
                });
        }

        // 2. Check or insert FROM location
        const fromLocation = await db('cop_toll_cal_location')
            .where({ lat: from_latitude, lng: from_longitude })
            .first();

        const fromLocationId = fromLocation
            ? fromLocation.id
            : (await db('cop_toll_cal_location').insert({
                address: from_address,
                lat: from_latitude,
                lng: from_longitude,
                uuid: db.raw("UUID()")
            }))[0];

        // 3. Check or insert TO location
        const toLocation = await db('cop_toll_cal_location')
            .where({ lat: to_latitude, lng: to_longitude })
            .first();

        const toLocationId = toLocation
            ? toLocation.id
            : (await db('cop_toll_cal_location').insert({
                address: to_address,
                lat: to_latitude,
                lng: to_longitude,
                uuid: db.raw("UUID()")
            }))[0];

        // 4. Get Fuel Data (Optional)
        let cityData = null;
        if (cityUuidFromCookie) {
            const today = new Date().toISOString().split("T")[0];
            const rows = await db
                .select("cop_fuel_price_data.fuel_type", "cop_fuel_price_data.retail_price", "cop_city_ms.uuid")
                .from("cop_city_ms")
                .innerJoin("cop_fuel_price_data", "cop_city_ms.city_id", "cop_fuel_price_data.fp_city_id")
                .where("cop_city_ms.uuid", cityUuidFromCookie)
                .andWhereRaw("DATE(cop_fuel_price_data.as_on_date) = ?", [today]);

            if (rows.length) {
                cityData = { uuid: rows[0].uuid, fuels: {} };
                rows.forEach(row => {
                    cityData.fuels[row.fuel_type] = row.retail_price;
                });
            }
        }

        // 5. Check for Cached Toll Response
        const cached = await db('cop_toll_cal_response')
            .join('cop_toll_cal_location as from_location', 'cop_toll_cal_response.from', '=', 'from_location.id')
            .join('cop_toll_cal_location as to_location', 'cop_toll_cal_response.to', '=', 'to_location.id')
            .where('from_location.lat', from_latitude)
            .andWhere('from_location.lng', from_longitude)
            .where('to_location.lat', to_latitude)
            .andWhere('to_location.lng', to_longitude)
            .where('cop_toll_cal_response.status', 1)
            .select('cop_toll_cal_response.response')
            .first();

        if (cached) {
            return {
                apiRes: JSON.parse(cached.response),
                fuelData: cityData
            };
        }

        // 6. Call TollGuru API
        const currentTime = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        const jsonInput = [
            {
                json: {
                    from: {
                        address: from_address,
                        lat: parseFloat(from_latitude),
                        lng: parseFloat(from_longitude),
                        meta: {
                            city: from_city_name,
                            country: from_country,
                            state: from_state_code,
                            stateName: from_state_name,
                            uri: from_uri
                        }
                    },
                    to: {
                        address: to_address,
                        lat: parseFloat(to_latitude),
                        lng: parseFloat(to_longitude),
                        meta: {
                            city: to_city_name,
                            country: to_country,
                            state: to_state_code,
                            stateName: to_state_name,
                            uri: to_uri
                        }
                    },
                    vehicle: { type: "2AxlesAuto" },
                    tags: [], // Must be an array!
                    returnPath: "herePath",
                    returnFloats: true,
                    departure_time: currentTime,
                    units: {
                        currencyUnit: "INR",
                        fuelUnit: "Liter"
                    },
                    fuelOptions: {
                        fuelEfficiency: { city: 14, hwy: 18, units: "kmpl" },
                        fuelCost: { currency: "INR", value: 104.34, units: "₹/liter" }
                    }
                }
            }
        ];

        const input = encodeURIComponent(JSON.stringify(jsonInput));
        const url = `https://www.tollguru.com/api/trpc/calc.getRoutes?batch=1&input=${input}`;
        const response = await axios.get(url);
        const data = response.data;

        // Handle validation errors manually
        if (Array.isArray(data) && data[0]?.error?.json) {
            const apiErrorMessage = data[0].error.json.message;
            const zodFieldErrors = data[0].error.json.data?.zodError?.fieldErrors;

            if (zodFieldErrors?.tags?.length) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Toll API Error - tags: ${zodFieldErrors.tags.join(', ')}`);
            }

            throw new ApiError(httpStatus.BAD_REQUEST, `Toll API Error: ${apiErrorMessage}`);
        }

        // Save to DB
        await db('cop_toll_cal_response').insert({
            from: fromLocationId,
            to: toLocationId,
            payload: jsonInput,
            response: JSON.stringify(data),
            uuid: db.raw("UUID()")
        });

        return {
            apiRes: data,
            fuelData: cityData
        };

    } catch (err) {
        console.error("Unhandled error in tollTaxResponse:", err);

        const fallbackMessage = err.message || "Unexpected error occurred";
        const fallbackStatus = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

        throw new ApiError(fallbackStatus, fallbackMessage);
    }
};




module.exports = {
    tollTaxResponse

}