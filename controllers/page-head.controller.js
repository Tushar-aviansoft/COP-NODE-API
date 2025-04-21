const httpStatus = require("http-status");
const pageHeadService = require("../services/page-head.services");

const pageHead = async (req, res, next) => {
    try {
        const { page_name_slug } = req.body;
        const data = await pageHeadService.pageHead(
            page_name_slug
        );

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    pageHead
}