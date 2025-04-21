const httpStatus = require("http-status");
const dealershipServices = require("../services/dealership.services");

const brands = async (req, res, next) => {
    try {
        const brands = await dealershipServices.brands(req);

        res.status(httpStatus.OK).send(brands);
    } catch (error) {
        next(error);
    }
}

const dealerships = async (req, res, next) => {
    try {
        const { brand, city, page, limit, search } = req.query;

        const dealerships = await dealershipServices.dealerships(brand, city, page, limit, search);

        res.status(httpStatus.OK).send(dealerships);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    brands,
    dealerships
}