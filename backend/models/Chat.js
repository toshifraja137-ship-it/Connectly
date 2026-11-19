const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        lastMessage: {
            type: String,
            default: ""
        },
        lastMessageAt: {
            type: Date,
            default: Date.now
        },
        // Unread message count per participant (for the badge)
        unreadBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true
    }
);

// Find or create a 1-on-1 chat between two users
chatSchema.statics.findOrCreate = async function (userA, userB) {
    const participants = [userA, userB].sort((a, b) =>
        a.toString().localeCompare(b.toString())
    );

    let chat = await this.findOne({
        participants: { $all: participants }
    });

    if (!chat) {
        chat = await this.create({ participants });
    }

    return chat;
};

module.exports = mongoose.model("Chat", chatSchema);