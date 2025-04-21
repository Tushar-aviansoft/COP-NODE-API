const express = require("express");
const router = express.Router();
const subscribeController = require("../controllers/subscribe.controller");
const validateQuery = require("../middlewares/validate-query");
const { subscribeSchema } = require("../validations/subscribe.validation");

router.post("/", validateQuery(subscribeSchema), subscribeController.subscribe);

module.exports = router;
