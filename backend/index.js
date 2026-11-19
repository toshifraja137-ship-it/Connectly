require("dotenv").config();
const express = require("express");
const http = require("http");
const connectDB = require("./config/db");
const createChatSocket = require("./config/chatSocket");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const cors = require("cors");


connectDB();

const app = express();
const server = http.createServer(app);
const io = createChatSocket(server);
app.set("io", io);

app.use(cors());

app.use(express.json());

app.use("/api/comments", commentRoutes);


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "server is running"
    });
})

const PORT = 3000;

const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`Connectly server running on port ${PORT}`);
    });
};

startServer();