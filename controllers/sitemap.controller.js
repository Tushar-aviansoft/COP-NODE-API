const httpStatus = require("http-status");
const siteMapService = require("../services/sitemap.services");

const siteMapData = async (req, res, next) => {
    try {
        const { model, variant } = req.query;

        const data = await siteMapService.siteMap(model, variant);
        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    siteMapData
}