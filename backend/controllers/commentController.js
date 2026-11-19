const Notification = require("../models/Notification");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const mongoose = require("mongoose");

// Create a comment
const createComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        // Validate comment text
        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Create comment
        const comment = await Comment.create({
            post: id,
            user: req.user._id,
            text: text.trim()
        });

        // Add comment ID to post
        post.comments.push(comment._id);
        await post.save();

        // Create notification for post owner
        if (post.user.toString() !== req.user._id.toString()) {
            try {
                await Notification.create({
                    recipient: post.user,
                    sender: req.user._id,
                    type: "comment",
                    post: post._id
                });
            } catch (notificationError) {
                console.error(
                    "Comment notification error:",
                    notificationError
                );
            }
        }

        res.status(201).json({
            message: "Comment added successfully!",
            comment
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};





const getPostComments = async (req, res) => {
    try {
        const { id } = req.params;

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

        const comments = await Comment.find({ post: id })
            .populate("user", "name username profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Comments fetched successfully!",
            totalComments: comments.length,
            comments
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};



const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        // Check comment ownership
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You cannot delete another user's comment"
            });
        }

        await comment.deleteOne();

        // Remove comment reference from its post
        await Post.findByIdAndUpdate(comment.post, {
            $pull: { comments: comment._id }
        });

        res.status(200).json({
            message: "Comment deleted successfully!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createComment,
    getPostComments,
    deleteComment
};
