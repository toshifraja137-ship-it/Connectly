import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/home.css";

function ShareButton({ postId, user }) {
    const [shareOpen, setShareOpen] = useState(false);
    const [shareError, setShareError] = useState("");
    const [shareLoading, setShareLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [shareResults, setShareResults] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [shareSuccess, setShareSuccess] = useState("");
    const [copied, setCopied] = useState(false);
    const { user: loggedInUser } = useAuth();
    const navigate = useNavigate();

    // Copy link to post
    const handleCopyLink = (e) => {
        e.stopPropagation();
        const postUrl = `${window.location.origin}/#post-${postId}`;
        navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle sharing to another user via API
    const handleShareToUser = async (recipient) => {
        try {
            setShareLoading(true);
            setShareError("");

            const recipientId = recipient._id || recipient.id;

            await api.post("/posts/share", {
                postId: postId,
                otherUserId: recipientId
            });

            setShareSuccess(`Shared post with ${recipient.name || recipient.username}!`);
            setTimeout(() => {
                setShareSuccess("");
                handleClose();
            }, 1500);
        } catch (err) {
            console.error("Share error:", err);
            setShareError(
                err.response?.data?.message || "Unable to share post."
            );
        } finally {
            setShareLoading(false);
        }
    };

    // Search users to share with
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setShareResults([]);
            return;
        }
        try {
            const response = await api.get(
                `/users/search?q=${encodeURIComponent(query)}&limit=10`
            );
            setShareResults(response.data.users || []);
        } catch (error) {
            console.error("User search error:", error);
            setShareResults([]);
        }
    };

    const handleClose = () => {
        setShareOpen(false);
        setSearchQuery("");
        setShareResults([]);
        setSelectedRecipient(null);
        setShareError("");
        setShareSuccess("");
    };

    if (!loggedInUser) {
        return null;
    }

    return (
        <>
            <button
                className="post-share-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen(true);
                }}
                aria-label="Share post"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share</span>
            </button>

            {/* Share modal */}
            {shareOpen && (
                <div className="share-modal-overlay" onClick={handleClose}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>Share Post</h3>
                            <button className="share-modal-close" onClick={handleClose}>
                                ✕
                            </button>
                        </div>

                        {shareError && (
                            <p className="share-modal-error">{shareError}</p>
                        )}

                        {shareSuccess && (
                            <p className="share-modal-success">{shareSuccess}</p>
                        )}

                        {/* Direct action options */}
                        <div className="share-actions-row">
                            <button className="share-action-btn" onClick={handleCopyLink}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                {copied ? "Copied!" : "Copy Link"}
                            </button>
                        </div>

                        <div className="share-divider">
                            <span>or Send to a Person</span>
                        </div>

                        {/* Search users */}
                        <div className="share-search">
                            <input
                                type="text"
                                placeholder="Search users to share with..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery.trim().length >= 2 && (
                                <div className="share-search-results">
                                    {shareResults.length > 0 ? (
                                        shareResults.map((person) => {
                                            const personId = person._id || person.id;
                                            return (
                                                <div
                                                    key={personId}
                                                    className="share-search-item"
                                                >
                                                    <div className="share-search-avatar">
                                                        {person.profilePicture ? (
                                                            <img
                                                                src={person.profilePicture}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <span>
                                                                {person.name?.charAt(0)?.toUpperCase() || "U"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="share-search-info">
                                                        <strong>{person.name}</strong>
                                                        <span>@{person.username}</span>
                                                    </div>
                                                    <button
                                                        className="share-search-send-btn"
                                                        onClick={() => handleShareToUser(person)}
                                                        disabled={shareLoading}
                                                    >
                                                        Send
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="share-empty">No users found</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ShareButton;