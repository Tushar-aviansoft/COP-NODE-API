const httpStatus = require("http-status");
const seoService = require("../services/seo.services");

const seoMetaData = async (req, res, next) => {
    try {
        const { brand, model, variant, page_name_slug } = req.body;

        console.log(brand,model, variant, page_name_slug );
        

        const data = await seoService.seoMetaData(
            brand,
            model,
            variant,
            page_name_slug
        );

        res.status(httpStatus.OK).send(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    seoMetaData,
}