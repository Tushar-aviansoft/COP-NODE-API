const httpStatus = require("http-status");
const warningLightsServices = require("../services/warning-light.services");

const warningLights = async (req, res, next) => {
  try {
    const data = await warningLightsServices.warningLights();

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  warningLights,
};
