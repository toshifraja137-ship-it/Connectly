
const express = require("express");
const router = express.Router();

const {protect, optionalAuth} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


const {
    getMyProfile,
    updateMyProfile,
    uploadProfilePicture,
    removeProfilePicture,
    getUserProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getAllUsers,
    searchUsers
} = require("../controllers/userController");

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.post("/me/profile-picture", protect, upload.single("profilePicture"), uploadProfilePicture);
router.delete("/me/profile-picture", protect, removeProfilePicture);
router.post("/:id/follow", protect, followUser);
router.get("/search", protect, searchUsers);
router.get("/:username", optionalAuth, getUserProfile);
router.post("/:id/unfollow", protect, unfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
router.get("/", protect, getAllUsers);

module.exports = router;
