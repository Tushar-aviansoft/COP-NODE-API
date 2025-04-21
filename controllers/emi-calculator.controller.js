const httpStatus = require("http-status");
const emiCalculatorService = require("../services/emi-calculator.services");

const emiVariantDetail = async (req, res, next) => {
    try {
        const { brand, model, variant } = req.params;
        const city = req.city;
        const auth = req.auth;
        const data = await emiCalculatorService.emiVariantDetail(
            brand,
            model,
            variant,
            city,
            auth
        );

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    emiVariantDetail
}