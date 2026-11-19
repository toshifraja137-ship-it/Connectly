const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
    getChats,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    startChat
} = require("../controllers/chatController");

router.get("/", protect, getChats);
router.post("/start/:otherUserId", protect, startChat);
router.get("/:chatId/messages", protect, getMessages);
router.post("/:chatId/messages", protect, upload.array("images", 10), sendMessage);
router.put("/:chatId/messages/:messageId", protect, editMessage);
router.delete("/:chatId/messages/:messageId", protect, deleteMessage);

module.exports = router;