const httpStatus = require("http-status");
const tollTaxService = require("../services/toll-tax.services");


const tollTaxResponse = async (req, res, next) => {

    try {
        const { from_address, from_latitude, from_longitude, from_city_name,
            from_country, from_state_code, from_state_name, from_uri,
            to_address, to_latitude, to_longitude, to_city_name,
            to_country, to_state_code, to_state_name, to_uri, } = req.body;
        const { page_name } = req.params;
        const auth = req.auth;
        const cityUuidFromCookie = req.cookies.city;

        const data = await tollTaxService.tollTaxResponse(
            from_address, from_latitude, from_longitude, from_city_name,
            from_country, from_state_code, from_state_name, from_uri,
            to_address, to_latitude, to_longitude, to_city_name,
            to_country, to_state_code, to_state_name, to_uri,
            page_name, auth, cityUuidFromCookie
        );

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    tollTaxResponse,
    
}