
const express = require("express");
const router = express.Router();

const {protect, optionalAuth} = require("../middleware/authMiddleware");

const {
    createComment,
    getPostComments,
    deleteComment
} = require("../controllers/commentController");

// Create comment on a post
router.post("/posts/:id", protect, createComment);

// Get comments of a post
router.get("/posts/:id", getPostComments);

// Delete a comment
router.delete("/:id", protect, deleteComment);

module.exports = router;
