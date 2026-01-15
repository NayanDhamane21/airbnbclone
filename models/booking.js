const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkin: {
        type: Date,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["booked", "cancelled"],
        default: "booked"
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
