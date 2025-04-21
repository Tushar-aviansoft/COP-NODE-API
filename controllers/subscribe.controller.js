const subscribeService = require("../services/subscribe.services");
const httpStatus = require("http-status");

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.query;
    const data = await subscribeService.subscribe(email);
    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};
module.exports = { subscribe };
