const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
    },
    { _id: false }
);


const User = mongoose.model("user", userDetailsSchema);

module.exports = { User };
