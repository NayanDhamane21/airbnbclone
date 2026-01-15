const Booking = require("../models/booking");
const Listing = require("../models/listing");
const nodemailer = require("nodemailer");

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

        // 🔎 CHECK OVERLAPPING BOOKINGS
        const conflictingBooking = await Booking.findOne({
            listing: id,
            status: "booked",
            $or: [
                {
                    checkin: { $lt: checkOutDate },
                    checkout: { $gt: checkInDate }
                }
            ]
        });

        if (conflictingBooking) {
            req.flash("error", "Listing already booked for selected dates");
            return res.redirect(`/listings/${id}`);
        }

        // ✅ CREATE BOOKING
        const booking = new Booking({
            listing: id,
            user: req.user._id,
            checkin: checkInDate,
            checkout: checkOutDate
        });

        await booking.save();

        // 📧 SEND EMAIL TO OWNER
        const listing = await Listing.findById(id).populate("owner");

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Wanderlust Booking" <${process.env.EMAIL_USER}>`,
            to: listing.owner.email,
            subject: "New Booking Request",
            html: `
                <h3>New Booking</h3>
                <p>Listing: ${listing.title}</p>
                <p>Guest: ${req.user.username} (${req.user.email})</p>
                <p>Check-in: ${checkin}</p>
                <p>Check-out: ${checkout}</p>
            `
        });

        req.flash("success", "Booking successful! Owner notified.");
        res.redirect(`/listings/${id}`);

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong");
        res.redirect(`/listings/${req.params.id}`);
    }
};
