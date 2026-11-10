const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            return this.authProvider !== "google";
        },
        minlength: 6
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    googleId: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },
    avatar: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);