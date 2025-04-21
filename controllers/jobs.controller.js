const httpStatus = require("http-status");
const jobsService = require('../services/jobs.services');

const fuelPriceCreateOrUpdate = async (req, res, next) => {
    try {
        const data = await jobsService.fuelPriceCreateOrUpdate();

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

const settingApiKeyStatusUpdate = async (req, res, next) => {
    try {
        const data = await jobsService.settingApiKeyStatusUpdate();

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

const updateTollFuelUserCount = async (req, res, next) => {
    try {
        const data = await jobsService.updateTollFuelUserCount();

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

const sendBirthdayWishes = async (req, res, next) => {
    try {
        const data = await jobsService.sendBirthdayWishes();

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

const sendAnniversaryWishes = async (req, res, next) => {
    try {
        const data = await jobsService.sendAnniversaryWishes();

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    fuelPriceCreateOrUpdate,
    settingApiKeyStatusUpdate,
    updateTollFuelUserCount,
    sendBirthdayWishes,
    sendAnniversaryWishes
}