const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createChatSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: true,
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("_id");
            if (!user) {
                return next(new Error("User no longer exists"));
            }

            socket.data.userId = user._id.toString();
            next();
        } catch (error) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`user:${socket.data.userId}`);

        // Join a specific chat room when opening a conversation
        socket.on("chat:join", ({ chatId }) => {
            socket.join(`chat:${chatId}`);
        });

        // Typing indicators — emit to everyone in the chat except the sender
        socket.on("chat:typing", ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit("chat:typing", {
                chatId,
                userId: socket.data.userId
            });
        });

        socket.on("chat:stop_typing", ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit("chat:stop_typing", {
                chatId,
                userId: socket.data.userId
            });
        });

        // Message status updates
        socket.on("chat:message_delivered", ({ chatId, messageId }) => {
            socket.to(`chat:${chatId}`).emit("chat:message_delivered", {
                chatId,
                messageId
            });
        });

        socket.on("chat:message_seen", ({ chatId, messageId }) => {
            socket.to(`chat:${chatId}`).emit("chat:message_seen", {
                chatId,
                messageId
            });
        });
    });

    return io;
};

module.exports = createChatSocket;
