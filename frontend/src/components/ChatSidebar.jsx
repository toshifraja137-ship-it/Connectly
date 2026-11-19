import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/chat.css";

function ChatSidebar({
    chats,
    activeChatId,
    onSelect,
    onChatStarted
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Search users to start a new conversation
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const response = await api.get(
                `/users/search?q=${encodeURIComponent(query)}&limit=10`
            );
            setSearchResults(response.data.users || []);
        } catch (error) {
            console.error("User search error:", error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Start a brand-new chat with a user found in search
    const handleStartChat = async (person) => {
        try {
            const response = await api.post(
                `/chats/start/${person._id}`
            );
            const chat = response.data.chat;
            const other =
                chat.participants.find(
                    (p) => p._id !== person._id
                ) || person;

            onChatStarted({
                _id: chat._id,
                user: other,
                lastMessage: "",
                lastMessageAt: chat.createdAt,
                unreadCount: 0
            });
            setSearchQuery("");
            setSearchResults([]);
        } catch (error) {
            console.error("Start chat error:", error);
            alert(
                error.response?.data?.message ||
                    "Unable to start chat."
            );
        }
    };

    const formatTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
        return d.toLocaleDateString([], {
            month: "short",
            day: "numeric"
        });
    };

    const getInitials = (person) => {
        if (!person) return "U";
        return (
            person.name?.charAt(0)?.toUpperCase() ||
            person.username?.charAt(0)?.toUpperCase() ||
            "U"
        );
    };

    return (
        <div className="chat-sidebar">
            <div className="chat-sidebar-header">
                <h2>Messages</h2>
            </div>

            {/* New chat search */}
            <div className="chat-search">
                <input
                    type="text"
                    placeholder="Search users to message..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery.trim().length >= 2 && (
                    <div className="chat-search-results">
                        {searching ? (
                            <p>Searching...</p>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((person) => (
                                <div
                                    key={person._id}
                                    className="chat-search-item"
                                >
                                    <Link
                                        to={`/profile/${person.username}`}
                                        className="chat-search-info"
                                    >
                                        <div className="chat-search-avatar">
                                            {person.profilePicture ? (
                                                <img
                                                    src={person.profilePicture}
                                                    alt=""
                                                />
                                            ) : (
                                                getInitials(person)
                                            )}
                                        </div>
                                        <div>
                                            <strong>
                                                {person.name}
                                            </strong>
                                            <span>
                                                @{person.username}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        className="chat-search-message-btn"
                                        onClick={() =>
                                            handleStartChat(person)
                                        }
                                    >
                                        Message
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No users found</p>
                        )}
                    </div>
                )}
            </div>

            {/* Chat list */}
            <div className="chat-list">
                {chats.length === 0 ? (
                    <div className="chat-empty">
                        <p>No conversations yet.</p>
                        <p className="chat-empty-hint">
                            Search for someone above to start chatting.
                        </p>
                    </div>
                ) : (
                    chats.map((chat) => {
                        const otherUser = chat.user;
                        const isActive = activeChatId === chat._id;
                        return (
                            <button
                                key={chat._id}
                                className={`chat-list-item ${
                                    isActive ? "active" : ""
                                }`}
                                onClick={() => onSelect(chat)}
                            >
                                <div className="chat-list-avatar">
                                    {otherUser?.profilePicture ? (
                                        <img
                                            src={
                                                otherUser.profilePicture
                                            }
                                            alt=""
                                        />
                                    ) : (
                                        getInitials(otherUser)
                                    )}
                                </div>
                                <div className="chat-list-content">
                                    <div className="chat-list-top">
                                        <span className="chat-list-name">
                                            {otherUser?.name ||
                                                otherUser?.username ||
                                                "User"}
                                        </span>
                                        <span className="chat-list-time">
                                            {formatTime(
                                                chat.lastMessageAt
                                            )}
                                        </span>
                                    </div>
                                    <div className="chat-list-bottom">
                                        <span className="chat-list-preview">
                                            {chat.lastMessage ||
                                                "Start of the conversation"}
                                        </span>
                                        {chat.unreadCount > 0 && (
                                            <span className="chat-unread-badge">
                                                {chat.unreadCount > 99
                                                    ? "99+"
                                                    : chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default ChatSidebar;