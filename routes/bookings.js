const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookings");
const { islogin } = require("../middlewares");

/* CREATE BOOKING */
router.post(
  "/listings/:id/book",
  islogin,
  bookingController.createBooking
);

/* PAYMENT PAGE */
router.get(
  "/bookings/:id/pay",
  islogin,
  bookingController.renderPaymentPage
);

/* CREATE ORDER */
router.post(
  "/bookings/:id/create-order",
  islogin,
  bookingController.createPaymentOrder
);

/* VERIFY PAYMENT */
router.post(
  "/bookings/:id/verify-payment",
  islogin,
  bookingController.verifyPayment
);

module.exports = router;
