const Booking = require("../models/booking");
const Listing = require("../models/listing");
const Payment = require("../models/Payment");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* =========================
   RAZORPAY INSTANCE
========================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =========================
   CREATE BOOKING (PENDING)
========================= */
module.exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkin, checkout } = req.body;

    const checkInDate = new Date(checkin);
    const checkOutDate = new Date(checkout);

    if (checkInDate >= checkOutDate) {
      req.flash("error", "Checkout date must be after check-in");
      return res.redirect(`/listings/${id}`);
    }

    const conflictingBooking = await Booking.findOne({
      listing: id,
      status: "booked",
      checkin: { $lt: checkOutDate },
      checkout: { $gt: checkInDate },
    });

    if (conflictingBooking) {
      req.flash("error", "Listing already booked for selected dates");
      return res.redirect(`/listings/${id}`);
    }

    const booking = new Booking({
      listing: id,
      user: req.user._id,
      checkin: checkInDate,
      checkout: checkOutDate,
      status: "pending",
    });

    await booking.save();
    res.redirect(`/bookings/${booking._id}/pay`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect(`/listings/${req.params.id}`);
  }
};

/* =========================
   RENDER PAYMENT PAGE
========================= */
module.exports.renderPaymentPage = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("listing");

  if (!booking || booking.user.toString() !== req.user._id.toString()) {
    req.flash("error", "Unauthorized");
    return res.redirect("/");
  }

  const days =
    (booking.checkout - booking.checkin) / (1000 * 60 * 60 * 24);

  const totalAmount = days * booking.listing.price;

  res.render("bookings/pay.ejs", {
    booking,
    totalAmount,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
  });
};

/* =========================
   CREATE RAZORPAY ORDER
========================= */
module.exports.createPaymentOrder = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("listing");

    if (!booking || booking.status !== "pending") {
      return res.status(400).json({ error: "Invalid booking" });
    }

    const days =
      (booking.checkout - booking.checkin) / (1000 * 60 * 60 * 24);

    const amount = days * booking.listing.price;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `booking_${booking._id}`,
    });

    res.json({
      id: order.id,
      amount: order.amount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
};

/* =========================
   VERIFY PAYMENT + EMAIL
========================= */
module.exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    const booking = await Booking.findById(req.params.id).populate({
      path: "listing",
      populate: { path: "owner" },
    });

    if (!booking || booking.status !== "pending") {
      return res.status(400).json({ success: false });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    booking.status = "booked";
    await booking.save();

    // 🚀 SEND RESPONSE IMMEDIATELY
    res.json({ success: true });

    // 🔁 BACKGROUND TASK (email + payment record)
    setImmediate(async () => {
      try {
        await Payment.create({
          booking: booking._id,
          user: booking.user,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: booking.totalAmount,
          status: "SUCCESS",
        });

        if (booking.listing.owner?.email) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            to: booking.listing.owner.email,
            subject: "New Paid Booking",
            html: `<p>New booking for <b>${booking.listing.title}</b></p>`,
          });
        }
      } catch (err) {
        console.error("🔥 Background task failed:", err);
      }
    });

  } catch (err) {
    console.error("🔥 verifyPayment error:", err);
    res.status(500).json({ success: false });
  }
};




    