const searchService = require("../services/search.services");
const httpStatus = require("http-status");

const search = async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const data = await searchService.search(search);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { search };
