const exploreBrandService = require("../services/explore-brand.services");
const httpStatus = require("http-status");

const brands = async (req, res, next) => {
  const { models, carTypes } = req.query;
  try {
    const data = await exploreBrandService.brands(models, carTypes);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const models = async (req, res, next) => {
  try {
    const { page, limit, carType } = req.query;
    const { slug } = req.params;
    const city = req.city;
    const auth = req.auth;

    const models = await exploreBrandService.models(
      slug,
      carType,
      city,
      page,
      limit,
      auth
    );

    res.status(httpStatus.OK).send(models);
  } catch (error) {
    next(error);
  }
};



const variants = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const { type } = req.query;
    const city = req.city ?? null;
    const models = await exploreBrandService.variants(brand, model, city, type);

    res.status(httpStatus.OK).send(models);
  } catch (error) {
    next(error);
  }
};


const gallery = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const data = await exploreBrandService.gallery(brand, model);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const setPriceAlert = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const auth = req.auth;
    const data = await exploreBrandService.setPriceAlert(auth, brand, model);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const variantDetail = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;
    const { similarVariants } = req.query;

    const city = req.city ?? null;
    const auth = req.auth;

    const data = await exploreBrandService.variantDetail(
      brand,
      model,
      variant,
      city,
      similarVariants,
      auth
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const variantColors = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;

    const data = await exploreBrandService.variantColors(brand, model, variant);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const variantPrice = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;
    const city = req.city ?? null;
    const auth = req.auth;
    const data = await exploreBrandService.variantPrice(
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
};
const variantSpecifications = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;
    const isShort = req.query.short === 'true'
    const data = await exploreBrandService.variantSpecifications(
      brand,
      model,
      variant,
      isShort
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const variantKeyHighlights = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;
    const data = await exploreBrandService.variantKeyHighlights(
      brand,
      model,
      variant
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const variantDescription = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;
    const city = req.city ?? null;
    const data = await exploreBrandService.variantDescription(
      brand,
      model,
      variant,
      city
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
const variantFaq = async (req, res, next) => {
  try {
    const { brand, model, variant } = req.params;
    const city = req.city ?? null;
    const data = await exploreBrandService.variantFaq(
      brand,
      model,
      variant,
      city
    );

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
}

const modelDescription = async (req, res, next) => {
  try {
    const { brand, model } = req.params;
    const data = await exploreBrandService.modelDescription(brand, model);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

const similarModels = async (req, res, next) => {
  try {
    const { brand } = req.params;
    const data = await exploreBrandService.similarModels(brand);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};


const newsBlogsModelList = async (req, res, next) => {
  try {
    const { brand_name } = req.body;
    const data = await exploreBrandService.newsBlogsModelList(brand_name);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

const newsBlogsModelDescription = async (req, res, next) => {
  try {
    const { model_name } = req.body;
    const data = await exploreBrandService.newsBlogsModelDescription(model_name);
    res.status(httpStatus.OK).send({ status: 'success', data });
  } catch (error) {
    // This is missing in your code!
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || "Something went wrong",
    });
  }
};



module.exports = {
  brands,
  models,
  variants,
  gallery,
  setPriceAlert,
  variantDetail,
  variantColors,
  variantPrice,
  variantSpecifications,
  variantKeyHighlights,
  variantDescription,
  variantFaq,
  modelDescription,
  similarModels,
  newsBlogsModelList,
  newsBlogsModelDescription
};
