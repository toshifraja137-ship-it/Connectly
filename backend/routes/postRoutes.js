const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {protect, optionalAuth} = require("../middleware/authMiddleware");

const {
    createPost,
    getAllPosts,
    getTrendingPosts,
    getPostsByUser,
    getPostById,
    deletePost,
    editPost,
    toggleLike,
    sharePost
} = require("../controllers/postController");

// Create a post (supports multiple images)
router.post("/", protect, upload.array("image", 10), createPost);

// Share a post to a user
router.post("/share", protect, sharePost);

// Get posts by user ID
router.get("/user/:userId", protect, getPostsByUser);

// get all posts
router.get("/", optionalAuth, getAllPosts);

// Get trending posts
router.get("/trending", protect, getTrendingPosts);

// get post by id
router.get("/:id", getPostById);

// delete a post
router.delete("/:id", protect, deletePost);

// Edit a post
router.put("/:id", protect, editPost);

// like toggles
router.put("/:id/like", protect, toggleLike);

module.exports = router;