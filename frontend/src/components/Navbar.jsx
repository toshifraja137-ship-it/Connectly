import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import CreatePostModal from "../components/CreatePostModal";
import "../styles/navbar.css";

function Navbar() {
    const { user, logout } = useAuth();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create post modal
    const [createOpen, setCreateOpen] = useState(false);

    // Notification unread count
    const [unreadCount, setUnreadCount] = useState(0);

    // Chat unread count
    const [chatUnreadCount, setChatUnreadCount] = useState(0);

    // Fetch unread notifications
    useEffect(() => {
        if (!user) {
            return;
        }

        const fetchNotifications = async () => {
            try {
                const response = await api.get("/notifications");
                setUnreadCount(response.data.unreadCount || 0);
            } catch (error) {
                console.error("Notification fetch error:", error);
            }
        };

        const fetchChatUnread = async () => {
            try {
                const response = await api.get("/chats");
                const total = (response.data.chats || []).reduce(
                    (sum, chat) => sum + (chat.unreadCount || 0),
                    0
                );
                setChatUnreadCount(total);
            } catch (error) {
                console.error("Chat unread fetch error:", error);
            }
        };

        fetchNotifications();
        fetchChatUnread();

        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications();
            fetchChatUnread();
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Search users
    useEffect(() => {
        if (!user || query.trim().length < 1) {
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);

                const response = await api.get(
                    `/users/search?q=${encodeURIComponent(query)}&limit=5`
                );

                setResults(response.data.users || []);
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query, user]);

    return (
        <>
        <nav className="navbar">
            <div className="navbar-container">

                <Link to="/" className="logo">
                    Connectly
                </Link>

                {user && (
                    <div className="navbar-search">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />

                        {query.trim() && (
                            <div className="search-results">
                                {loading ? (
                                    <p>Searching...</p>
                                ) : results.length > 0 ? (
                                    results.map((person) => (
                                        <Link
                                            to={`/profile/${person.username}`}
                                            className="search-user"
                                            key={person._id}
                                            onClick={() => setQuery("")}
                                        >
                                            <div className="search-avatar">
                                                {person.profilePicture ? (
                                                    <img
                                                        src={person.profilePicture}
                                                        alt=""
                                                    />
                                                ) : (
                                                    person.name?.charAt(0).toUpperCase() || "U"
                                                )}
                                            </div>

                                            <div>
                                                <strong>{person.name}</strong>
                                                <span>@{person.username}</span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p>No users found</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="navbar-links">
                    <Link to="/">Home</Link>

                    {user ? (
                        <>
                            <button
                                className="create-post-btn"
                                onClick={() => setCreateOpen(true)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 5v14" />
                                    <path d="M5 12h14" />
                                </svg>
                                Create
                            </button>

                            {/* Notifications */}
                            <Link
                                to="/notifications"
                                className="notification-link"
                                title="Notifications"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="25"
                                    height="25"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                    <path d="M10 21h4" />
                                </svg>

                                {unreadCount > 0 && (
                                    <span className="notification-badge">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </Link>

                            {/* Chat */}
                            <Link
                                to="/chat"
                                className="chat-link"
                                title="Messages"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>

                                {chatUnreadCount > 0 && (
                                    <span className="chat-badge">
                                        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                                    </span>
                                )}
                            </Link>

                            <button
                                className="logout-btn"
                                onClick={logout}
                            >
                                Logout
                            </button>

                            <Link
                                to={`/profile/${user.username}`}
                                className="profile-avatar"
                            >
                                {user.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                    />
                                ) : (
                                    user.name?.charAt(0).toUpperCase() || "U"
                                )}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register" className="signup-btn">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

            </div>
        </nav>

        <CreatePostModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onPostCreated={() => window.location.reload()}
        />
        </>
    );
}

export default Navbar;