const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },
        images: {
            type: [String],
            default: []
        },
        image: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent"
        },
        isRead: {
            type: Boolean,
            default: false
        },
        // Optional post referenced when a message is a post share
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Message", messageSchema);