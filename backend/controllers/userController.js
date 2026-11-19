const imagekit = require("../config/imagekit");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Upload a profile picture for the logged-in user
const uploadProfilePicture = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                message: "Please select an image file"
            });
        }

        const uploaded = await imagekit.upload({
            file: file.buffer,
            fileName: "profile-" + req.user._id + "-" + Date.now() + "-" + file.originalname,
            folder: "/Connectly/profiles"
        });

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.profilePicture = uploaded.url;
        await user.save();

        res.status(200).json({
            message: "Profile picture updated successfully!",
            profilePicture: uploaded.url,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error("Upload profile picture error:", error);
        res.status(500).json({
            message: "Server error while uploading profile picture"
        });
    }
};



// Remove the logged-in user's profile picture
const removeProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.profilePicture = "";
        await user.save();

        res.status(200).json({
            message: "Profile picture removed successfully!",
            profilePicture: "",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error("Remove profile picture error:", error);
        res.status(500).json({
            message: "Server error while removing profile picture"
        });
    }
};

// Get logged-in user's profile
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        

        res.status(200).json({
            message: "Profile fetched successfully!",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followersCount: user.followers.length,
                followingCount: user.following.length,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Update logged-in user's profile
const updateMyProfile = async (req, res) => {
    try {
        const { name, bio } = req.body;

        // Check whether at least one field was provided
        if (name === undefined && bio === undefined) {
            return res.status(400).json({
                message: "Please provide name or bio to update"
            });
        }

        // Validate name
        if (name !== undefined && !name.trim()) {
            return res.status(400).json({
                message: "Name cannot be empty"
            });
        }

        // Find the logged-in user
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update only the fields provided
        if (name !== undefined) {
            user.name = name.trim();
        }

        if (bio !== undefined) {
            user.bio = bio.trim();
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully!",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};



// Get another user's public profile
const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({
            username: username.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User profile fetched successfully!",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followersCount: user.followers.length,
                followingCount: user.following.length,
                createdAt: user.createdAt,
                isFollowing: req.user
                    ? req.user.following.some(
                        (id) => id.toString() === user._id.toString()
                    )
                    : false
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Follow a user
const followUser = async (req, res) => {
    try {
        const { id } = req.params;

        const userToFollow = await User.findById(id);

        if (!userToFollow) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        if (req.user.following.includes(userToFollow._id)) {
            return res.status(400).json({
                message: "You are already following this user"
            });
        }

        // Update both users
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { following: userToFollow._id }
        });

        await User.findByIdAndUpdate(userToFollow._id, {
            $addToSet: { followers: req.user._id }
        });

        // Create follow notification
        try {
            await Notification.create({
                recipient: userToFollow._id,
                sender: req.user._id,
                type: "follow"
            });
        } catch (notificationError) {
            console.error("Follow notification error:", notificationError);
        }

        res.status(200).json({
            message: "User followed successfully!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Unfollow a user
const unfollowUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check whether target user exists
        const userToUnfollow = await User.findById(id);

        if (!userToUnfollow) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Prevent unfollowing yourself
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot unfollow yourself"
            });
        }

        // Check if currently following
        if (!req.user.following.includes(userToUnfollow._id)) {
            return res.status(400).json({
                message: "You are not following this user"
            });
        }

        // Remove target user from your following list
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { following: userToUnfollow._id }
        });

        // Remove your ID from their followers list
        await User.findByIdAndUpdate(userToUnfollow._id, {
            $pull: { followers: req.user._id }
        });

        res.status(200).json({
            message: "User unfollowed successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get a user's followers
const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .populate("followers", "name username profilePicture");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Followers fetched successfully!",
            totalFollowers: user.followers.length,
            followers: user.followers
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get users a person is following
const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .populate("following", "name username profilePicture");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Following fetched successfully!",
            totalFollowing: user.following.length,
            following: user.following
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get all users with pagination
const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

        const skip = (page - 1) * limit;

        // Exclude logged-in user directly in MongoDB
        const filter = {
            _id: { $ne: req.user._id }
        };

        const users = await User.find(filter)
            .select("name username bio profilePicture followers")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(filter);

        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            followersCount: user.followers.length
        }));

        res.status(200).json({
            message: "Users fetched successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            users: formattedUsers
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Search users with pagination
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({
                message: "Please enter a search query"
            });
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        // Search filter
        const filter = {
            _id: { $ne: req.user._id },
            $or: [
                { name: { $regex: q.trim(), $options: "i" } },
                { username: { $regex: q.trim(), $options: "i" } }
            ]
        };

        // Fetch matching users
        const users = await User.find(filter)
            .select("name username bio profilePicture followers")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Count matching users
        const totalUsers = await User.countDocuments(filter);

        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            followersCount: user.followers.length
        }));

        res.status(200).json({
            message: "Users searched successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            users: formattedUsers
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
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
};