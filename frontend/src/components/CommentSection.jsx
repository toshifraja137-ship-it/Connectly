
import { useEffect, useState } from "react";
import api from "../services/api";

function CommentSection({ postId, user, commentCount = 0 }) {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!showComments || commentsLoaded) return;

        const fetchComments = async () => {
            try {
                setLoading(true);
                const response = await api.get(
                    `/comments/posts/${postId}`
                );

                setComments(response.data.comments || []);
                setCommentsLoaded(true);
            } catch {
                setError("Unable to load comments.");
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [showComments, commentsLoaded, postId]);

    const handleAddComment = async (e) => {
        e.preventDefault();

        if (!text.trim() || submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const response = await api.post(
                `/comments/posts/${postId}`,
                { text: text.trim() }
            );

            const newComment = {
                ...response.data.comment,
                user: {
                    _id: user._id || user.id,
                    name: user.name,
                    username: user.username,
                    profilePicture: user.profilePicture
                }
            };

            setComments((prev) => [newComment, ...prev]);
            setCommentsLoaded(true);
            setText("");
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to add comment."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            setDeletingId(commentId);
            setError("");

            await api.delete(`/comments/${commentId}`);

            setComments((prev) =>
                prev.filter((comment) => comment._id !== commentId)
            );
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to delete comment."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const renderAvatar = (person, className) => (
        <div className={className}>
            {person?.profilePicture ? (
                <img src={person.profilePicture} alt="" />
            ) : (
                person?.name?.charAt(0)?.toUpperCase() || "U"
            )}
        </div>
    );

    return (
        <div className="comment-section">

            <button
                className="comments-toggle"
                onClick={() => setShowComments((prev) => !prev)}
            >
                <span>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path
                            d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {showComments ? "Hide comments" : `View all ${commentCount} comments`}
                </span>

                <span className={`comments-chevron ${showComments ? "open" : ""}`}>
                    ▼
                </span>
            </button>

            {showComments && (
                <div className="comments-panel">

                    <div className="comments-heading">
                        <h3>Comments</h3>
                        <span>{comments.length} comments</span>
                    </div>

                    {loading ? (
                        <p className="comments-status">Loading comments...</p>
                    ) : (
                        <div className="comments-list">
                            {comments.length === 0 ? (
                                <div className="empty-comments">
                                    <span>💬</span>
                                    <strong>No comments yet</strong>
                                    <p>Start the conversation!</p>
                                </div>
                            ) : (
                                comments.map((comment) => {
                                    const isOwnComment =
                                        user &&
                                        (
                                            user._id === comment.user?._id ||
                                            user.id === comment.user?._id
                                        );

                                    return (
                                        <div
                                            className="comment-item"
                                            key={comment._id}
                                        >
                                            {renderAvatar(
                                                comment.user,
                                                "comment-avatar"
                                            )}

                                            <div className="comment-content">
                                                <div className="comment-author">
                                                    <strong>
                                                        {comment.user?.name || "Unknown User"}
                                                    </strong>
                                                    <span>
                                                        @{comment.user?.username || "unknown"}
                                                    </span>
                                                </div>

                                                <p>{comment.text}</p>
                                            </div>

                                            {isOwnComment && (
                                                <button
                                                    className="delete-comment-btn"
                                                    onClick={() =>
                                                        handleDeleteComment(comment._id)
                                                    }
                                                    disabled={deletingId === comment._id}
                                                    title="Delete comment"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none">
                                                        <path
                                                            d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"
                                                            stroke="currentColor"
                                                            strokeWidth="1.7"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {error && (
                        <p className="comment-error">{error}</p>
                    )}

                    {user && (
                        <form
                            className="comment-form"
                            onSubmit={handleAddComment}
                        >
                            {renderAvatar(user, "comment-input-avatar")}

                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                maxLength={500}
                            />

                            <button
                                type="submit"
                                disabled={submitting || !text.trim()}
                                aria-label="Send comment"
                            >
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

export default CommentSection;
