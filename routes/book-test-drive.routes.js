const express = require("express");
const router = express.Router();
const bookTestDriveController = require("../controllers/book-test-drive.controller");
const authenticateJWT = require("../middlewares/jwt");
const validateBody = require("../middlewares/validate-body");
const {
  testDriveSchema,
} = require("../validations/book-test-drive.validation");

router.get("/preferences/:brand?/:model?", bookTestDriveController.preferences);
router.post(
  "/:brand/:model",
  authenticateJWT(true),
  validateBody(testDriveSchema),
  bookTestDriveController.bookTestDrive
);

module.exports = router;
