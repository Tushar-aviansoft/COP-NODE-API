const express = require("express");
const router = express.Router();
const jobsController = require("../controllers/jobs.controller");

router.post(
    "/fuel-price-create-or-update",
    jobsController.fuelPriceCreateOrUpdate
);

router.post(
    "/setting-api-key-status-update",
    jobsController.settingApiKeyStatusUpdate
);

router.post(
    "/update-toll-fuel-user-count",
    jobsController.updateTollFuelUserCount
);

router.post(
    "/send-birthday-wishes",
    jobsController.sendBirthdayWishes
);

router.post(
    "/send-anniversary-wishes",
    jobsController.sendAnniversaryWishes
);

module.exports = router;