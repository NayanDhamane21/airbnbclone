const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookings");
const { islogin } = require("../middlewares");

// POST booking
router.post(
  "/listings/:id/book",
  islogin,
  bookingController.createBooking
);

module.exports = router;
