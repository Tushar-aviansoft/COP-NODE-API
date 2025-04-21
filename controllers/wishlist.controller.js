const httpStatus = require("http-status");
const wishListServices = require("../services/wishlist.services");

const wishList = async (req, res, next) => {
  try {
    const auth = req.auth;
    const { brand, model, variant } = req.params;
    const city = req.city;
    console.log(city);

    const data = await wishListServices.wishList(
      auth,
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
const userWishList = async (req, res, next) => {
  try {
    const auth = req.auth;
    const city = req.city;
    const data = await wishListServices.userWishlist(auth, city);

    res.status(httpStatus.OK).send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  wishList,
  userWishList,
};
