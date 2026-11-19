const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Post = require("../models/Post");
const User = require("../models/User");
const imagekit = require("../config/imagekit");

const refreshChatPreview = async (chat) => {
    const latestMessage = await Message.findOne({ chat: chat._id })
        .sort({ createdAt: -1 });

    chat.lastMessage =
        latestMessage?.text ||
        (latestMessage?.images?.length
            ? `Sent ${latestMessage.images.length} photo${latestMessage.images.length === 1 ? "" : "s"}`
            : latestMessage?.image
              ? "Sent a photo"
              : "");
    chat.lastMessageAt = latestMessage?.createdAt || chat.createdAt;
    await chat.save();
};

// Get all chats for the logged-in user (with the other participant populated)
const getChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const chats = await Chat.find({
            participants: userId
        })
            .sort({ lastMessageAt: -1 })
            .lean();

        // Populate the other participant for each chat
        const result = [];
        for (const chat of chats) {
            const otherId = chat.participants.find(
                (id) => id.toString() !== userId.toString()
            );

            const otherUser = await User.findById(otherId).select(
                "name username profilePicture"
            );

            const unreadCount = await Message.countDocuments({
                chat: chat._id,
                isRead: false,
                sender: { $ne: userId }
            });

            result.push({
                _id: chat._id,
                user: otherUser,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
                unreadCount
            });
        }

        res.status(200).json({
            message: "Chats fetched successfully!",
            chats: result
        });
    } catch (error) {
        console.error("Get chats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get messages for a specific chat
const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (!chat.participants.includes(userId)) {
            return res
                .status(403)
                .json({ message: "Not authorized" });
        }

        const messages = await Message.find({ chat: chatId })
            .sort({ createdAt: 1 })
            .populate("sender", "name username profilePicture")
            .populate({
                path: "post",
                select: "caption images user",
                populate: { path: "user", select: "name username" }
            });

        // Mark messages from the other user as read
        await Message.updateMany(
            { chat: chatId, sender: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            message: "Messages fetched successfully!",
            messages
        });
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text, postId } = req.body;
        const userId = req.user._id;
        const files = req.files || [];

        const cleanedText = typeof text === "string" ? text.trim() : "";

        if (!cleanedText && files.length === 0 && !postId) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (!chat.participants.includes(userId)) {
            return res
                .status(403)
                .json({ message: "Not authorized" });
        }

        let sharePostId = null;
        if (postId) {
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res
                    .status(400)
                    .json({ message: "Invalid post ID" });
            }
            const sharedPost = await Post.findById(postId);
            if (!sharedPost) {
                return res
                    .status(404)
                    .json({ message: "Post not found" });
            }
            sharePostId = sharedPost._id;
        }

        const images = [];
        for (const [index, file] of files.entries()) {
            const uploaded = await imagekit.upload({
                file: file.buffer,
                fileName: `chat-${Date.now()}-${index}-${file.originalname}`,
                folder: "/Connectly/chat"
            });
            images.push(uploaded.url);
        }

        const message = await Message.create({
            chat: chatId,
            sender: userId,
            text: cleanedText || (files.length ? `Sent ${files.length} photo${files.length === 1 ? "" : "s"}` : ""),
            images,
            post: sharePostId
        });

        // Update the chat's last message
        chat.lastMessage = cleanedText || (files.length ? `Sent ${files.length} photo${files.length === 1 ? "" : "s"}` : "Shared a post");
        chat.lastMessageAt = new Date();
        await chat.save();

        const populated = await Message.findById(message._id)
            .populate("sender", "name username profilePicture")
            .populate({
                path: "post",
                select: "caption images user",
                populate: { path: "user", select: "name username" }
            });

        const io = req.app.get("io");
        for (const participantId of chat.participants) {
            io.to(`user:${participantId}`).emit("chat:message", {
                chatId: chat._id.toString(),
                message: populated
            });
        }

        res.status(201).json({
            message: "Message sent successfully!",
            message: populated
        });
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const editMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const userId = req.user._id;
        const text =
            typeof req.body.text === "string" ? req.body.text.trim() : "";

        if (
            !mongoose.Types.ObjectId.isValid(chatId) ||
            !mongoose.Types.ObjectId.isValid(messageId)
        ) {
            return res.status(400).json({ message: "Invalid ID" });
        }
        if (!text) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }
        if (text.length > 1000) {
            return res.status(400).json({ message: "Message is too long" });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }
        if (!chat.participants.some((id) => id.toString() === userId.toString())) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const message = await Message.findOne({
            _id: messageId,
            chat: chatId
        });
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.text = text;
        await message.save();
        await refreshChatPreview(chat);

        const populated = await Message.findById(message._id)
            .populate("sender", "name username profilePicture")
            .populate({
                path: "post",
                select: "caption images user",
                populate: { path: "user", select: "name username" }
            });

        const chatPreview = {
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt
        };
        const io = req.app.get("io");
        for (const participantId of chat.participants) {
            io.to(`user:${participantId}`).emit("chat:message_updated", {
                chatId: chat._id.toString(),
                message: populated,
                chatPreview
            });
        }

        res.status(200).json({
            message: "Message updated successfully",
            updatedMessage: populated,
            chatPreview
        });
    } catch (error) {
        console.error("Edit message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const userId = req.user._id;

        if (
            !mongoose.Types.ObjectId.isValid(chatId) ||
            !mongoose.Types.ObjectId.isValid(messageId)
        ) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }
        if (!chat.participants.some((id) => id.toString() === userId.toString())) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const message = await Message.findOne({
            _id: messageId,
            chat: chatId
        });
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await message.deleteOne();
        await refreshChatPreview(chat);

        const io = req.app.get("io");
        const chatPreview = {
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt
        };
        for (const participantId of chat.participants) {
            io.to(`user:${participantId}`).emit("chat:message_deleted", {
                chatId: chat._id.toString(),
                messageId,
                chatPreview
            });
        }

        res.status(200).json({
            message: "Message deleted successfully",
            messageId,
            chatPreview
        });
    } catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Start a chat with a user (creates the chat if it doesn't exist)
const startChat = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const userId = req.user._id;

        if (userId.toString() === otherUserId.toString()) {
            return res
                .status(400)
                .json({ message: "Cannot chat with yourself" });
        }

        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const chat = await Chat.findOrCreate(userId, otherUserId);

        const populatedChat = await Chat.findById(chat._id).populate(
            "participants",
            "name username profilePicture"
        );

        res.status(200).json({
            message: "Chat ready!",
            chat: populatedChat
        });
    } catch (error) {
        console.error("Start chat error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getChats,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    startChat
};