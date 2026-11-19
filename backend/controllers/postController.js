const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const Post = require("../models/Post");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const imagekit = require("../config/imagekit");


// Create a new post
const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const files = req.files || (req.file ? [req.file] : []);

        if ((!caption || !caption.trim()) && files.length === 0) {
            return res.status(400).json({
                message: "Please provide a caption or image"
            });
        }

        // Upload every selected image to ImageKit
        const images = [];
        for (const file of files) {
            const result = await imagekit.upload({
                file: file.buffer,
                fileName: `post-${Date.now()}-${file.originalname}`,
                folder: "/Connectly/posts"
            });
            images.push(result.url);
        }

        const post = await Post.create({
            user: req.user._id,
            caption: caption || "",
            images
        });

        res.status(201).json({
            message: "Post created successfully!",
            post
        });

    } catch (error) {
        console.error("Create post error:", error);

        res.status(500).json({
            message: "Server error while creating post"
        });
    }
};



// Get all posts for a specific user by ID (with pagination)
const getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { user: userId };

        const posts = await Post.find(filter)
            .populate("user", "name username profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPosts = await Post.countDocuments(filter);

        const formattedPosts = posts.map(post => {
            const postObject = post.toObject();

            return {
                ...postObject,
                imagesCount: post.images.length,
                likesCount: post.likes.length,
                commentsCount: post.comments.length,

                isLiked: req.user
                    ? post.likes.some(
                        userId =>
                            userId.toString() === req.user._id.toString()
                    )
                    : false
            };
        });

        res.status(200).json({
            message: "Posts fetched successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            posts: formattedPosts
        });
    } catch (error) {
        console.error("Get user posts error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get trending posts (most liked in last 7 days)
const getTrendingPosts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const posts = await Post.find({ createdAt: { $gte: oneWeekAgo } })
            .populate("user", "name username profilePicture")
            .sort({ likes: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPosts = await Post.countDocuments({ createdAt: { $gte: oneWeekAgo } });

        const formattedPosts = posts.map(post => {
            const postObject = post.toObject();

            const isLiked = req.user
                ? post.likes.some(
                    userId => userId.toString() === req.user._id.toString()
                )
                : false;

            return {
                ...postObject,
                imagesCount: post.images.length,
                likesCount: post.likes.length,
                commentsCount: post.comments.length,
                isLiked
            };
        });

        res.status(200).json({
            message: "Trending posts fetched successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            posts: formattedPosts
        });
    } catch (error) {
        console.error("Get trending posts error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get recommended users (users you don't follow, sorted by followers count)
const getRecommendedUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const user = await User.findById(req.user._id).select("following");
        const followingIds = user.following.map(id => id.toString());
        followingIds.push(req.user._id.toString());

        const filter = {
            _id: { $nin: followingIds.map(id => new mongoose.Types.ObjectId(id)) }
        };

        const users = await User.find(filter)
            .select("name username bio profilePicture followers following")
            .sort({ followers: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(filter);

        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            isFollowing: false
        }));

        res.status(200).json({
            message: "Recommended users fetched successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            users: formattedUsers
        });
    } catch (error) {
        console.error("Get recommended users error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all posts with pagination
const getAllPosts = async (req, res) => {
    try {
        // Get page and limit from query parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

        // Calculate how many posts to skip
        const skip = (page - 1) * limit;

        // Fetch posts and total count
        const posts = await Post.find()
            .populate("user", "name username profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPosts = await Post.countDocuments();

        // Format posts
        const formattedPosts = posts.map(post => {
            const postObject = post.toObject();

            const isFollowing = req.user?.following
                ? req.user.following.some(
                    userId =>
                        userId.toString() === post.user?._id.toString()
                )
                : false;

            return {
                ...postObject,
                imagesCount: post.images.length,
                likesCount: post.likes.length,
                commentsCount: post.comments.length,

                isLiked: req.user
                    ? post.likes.some(
                        userId =>
                            userId.toString() === req.user._id.toString()
                    )
                    : false,

                isFollowing
            };
        });

        res.status(200).json({
            message: "Posts fetched successfully!",
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            posts: formattedPosts
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};





// Get a single post by ID
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await Post.findById(id)
            .populate("user", "name username profilePicture");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.status(200).json({
            message: "Post fetched successfully!",
            post
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};



const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Check whether the logged-in user owns this post
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to delete this post"
            });
        }

        await post.deleteOne();

        res.status(200).json({
            message: "Post deleted successfully!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Edit an existing post
const editPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { caption } = req.body;

        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        // Validate caption
        if (typeof caption !== "string" || caption.length > 2200) {
            return res.status(400).json({
                message: "Caption must be a string with maximum 2200 characters"
            });
        }

        // Find post
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Check post ownership
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to edit this post"
            });
        }

        // Update caption
        post.caption = caption.trim();

        await post.save();

        res.status(200).json({
            message: "Post updated successfully!",
            post
        });

    } catch (error) {
        console.error("Edit post error:", error);

        res.status(500).json({
            message: "Server error while editing post"
        });
    }
};


const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const alreadyLiked = post.likes.some(
            (likeId) => likeId.toString() === userId.toString()
        );

        if (alreadyLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();

        // Create notification only when someone likes another user's post
        if (
            !alreadyLiked &&
            post.user.toString() !== userId.toString()
        ) {
            try {
                await Notification.create({
                    recipient: post.user,
                    sender: userId,
                    type: "like",
                    post: post._id
                });
            } catch (notificationError) {
                console.error(
                    "Like notification error:",
                    notificationError
                );
            }
        }

        res.status(200).json({
            message: alreadyLiked
                ? "Post unliked successfully!"
                : "Post liked successfully!",
            likesCount: post.likes.length,
            isLiked: !alreadyLiked
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};



// Share a post with another user via a 1-on-1 chat
const sharePost = async (req, res) => {
    try {
        const { postId, otherUserId } = req.body;
        const userId = req.user._id;

        if (!postId || !otherUserId) {
            return res.status(400).json({
                message: "Post ID and user ID are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(postId) ||
            !mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({
                message: "Invalid ID"
            });
        }

        if (userId.toString() === otherUserId.toString()) {
            return res.status(400).json({
                message: "You cannot share a post with yourself"
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Find or create the 1-on-1 chat between the two users
        const chat = await Chat.findOrCreate(userId, otherUserId);

        const message = await Message.create({
            chat: chat._id,
            sender: userId,
            text: "Shared a post",
            post: post._id
        });

        chat.lastMessage = "Shared a post";
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

        res.status(200).json({
            message: "Post shared successfully!",
            chatId: chat._id,
            message: populated
        });
    } catch (error) {
        console.error("Share post error:", error);
        res.status(500).json({
            message: "Server error while sharing post"
        });
    }
};

module.exports = {
    createPost,
    getAllPosts,
    getTrendingPosts,
    getPostsByUser,
    getPostById,
    deletePost,
    editPost,
    toggleLike,
    sharePost
};
