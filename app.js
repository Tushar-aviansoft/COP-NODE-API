const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { errorConverter, errorHandler } = require("./middlewares/error");
const homeRoute = require("./routes/home-page.routes");
const cityRoute = require("./routes/city.routes");
const exploreBrandRoute = require("./routes/explore-brand.routes");
const cors = require("cors");
const evCarsRoute = require("./routes/ev-cars.routes");
const evChargingStationRoute = require("./routes/ev-charging-station.routes");
const fuelStationRoute = require("./routes/fuel-station.routes");
const dealershipRoute = require("./routes/dealership.routes");
const advancedSearchRoute = require("./routes/advanced-search.routes");
const newlyLaunchedCarsRoute = require("./routes/newly-launched-cars.routes");
const upcomingCarsRoute = require("./routes/upcoming-cars.routes");
const compareCarsRoute = require("./routes/compare-cars.routes");
const warningLightsRoute = require("./routes/warning-light.routes");
const wishListRoute = require("./routes/wishlist.routes");
const loginRoute = require("./routes/login.routes");
const logOutRoute = require("./routes/logout.routes");
const deleteAccountRoute = require("./routes/delete-account.routes");
const reviewRoute = require("./routes/review.routes");
const subscribeRoute = require("./routes/subscribe.routes");

const myAccountRoute = require("./routes/my-account.routes");
const searchRoute = require("./routes/search.routes");
const bookTestDriveRoute = require("./routes/book-test-drive.routes");
const b2bInquiryRoute = require("./routes/b2b-inquiry.routes");

const carLoanRoute = require("./routes/car-loan.routes");
const carInsuranceRoute = require("./routes/car-insurance.routes");
const faqRoute = require("./routes/faq.routes");
const mailVerifyRoute = require("./routes/mail-verify.routes");
const emiCalculatorRoute = require("./routes/emi-calculator.routes");
const pageHeadRoute = require("./routes/page-head.routes");
const seoRoute = require("./routes/seo.routes");
const tollTaxRoute = require("./routes/toll-tax.routes");
const jobsRoute = require("./routes/jobs.routes");

const logger = require("./config/logger");

const initializeCrons = require("./jobs/index");

// initializeCrons();
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: '*',
    methods: '*',
  })
);
morgan.format("custom", ":method :url :status :response-time[3]ms");
app.use(
  morgan("custom", {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  })
);

//routes
app.use("/home", homeRoute);
app.use("/city", cityRoute);
app.use("/brands", exploreBrandRoute);
app.use("/ev-cars", evCarsRoute);
app.use("/electric-car-charging-station", evChargingStationRoute);
app.use("/fuel-station", fuelStationRoute);
app.use("/dealership", dealershipRoute);
app.use("/advanced-search", advancedSearchRoute);
app.use("/newly-launched-cars", newlyLaunchedCarsRoute);
app.use("/upcoming-cars", upcomingCarsRoute);
app.use("/compare-cars", compareCarsRoute);
app.use("/warning-lights", warningLightsRoute);
app.use("/login", loginRoute);
app.use("/log-out", logOutRoute);
app.use("/delete-account", deleteAccountRoute);

app.use("/user", myAccountRoute);

app.use("/wishlist", wishListRoute);
app.use("/test-drive", bookTestDriveRoute);
app.use("/ratings-and-reviews", reviewRoute);

app.use("/search", searchRoute);
app.use("/subscribe", subscribeRoute);
app.use("/b2b-inquiry", b2bInquiryRoute);
app.use("/car-loan", carLoanRoute);

app.use("/car-insurance", carInsuranceRoute);
app.use("/faq", faqRoute);
app.use("/mail", mailVerifyRoute);
app.use("/page-head", pageHeadRoute);
app.use("/emi-calculator", emiCalculatorRoute);
app.use("/toll-tax", tollTaxRoute);

app.use("/seo", seoRoute);

app.use("/job", jobsRoute);

app.get("/", (req, res)=>{
  res.send("hello from cop_api !!..")
})

app.use(errorConverter);
app.use(errorHandler);
module.exports = app;
