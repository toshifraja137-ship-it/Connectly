
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/notifications.css";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);

            const response = await api.get("/notifications");
            setNotifications(response.data.notifications || []);
        } catch (err) {
            console.error("Notifications error:", err);
            setError("Unable to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Mark as read, then navigate
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await api.put(`/notifications/${notification._id}/read`);

                setNotifications((prev) =>
                    prev.map((item) =>
                        item._id === notification._id
                            ? { ...item, isRead: true }
                            : item
                    )
                );
            } catch (err) {
                console.error("Mark notification error:", err);
            }
        }

        // Like and comment: open the related post
        if (
            (notification.type === "like" ||
                notification.type === "comment") &&
            notification.post?._id
        ) {
            navigate("/", {
                state: {
                    postId: notification.post._id
                }
            });

            return;
        }

        // Follow: open sender's profile
        if (notification.sender?.username) {
            navigate(`/profile/${notification.sender.username}`);
            return;
        }

        navigate("/");
    };

    const getMessage = (notification) => {
        if (notification.type === "like") {
            return "liked your post";
        }

        if (notification.type === "follow") {
            return "started following you";
        }

        if (notification.type === "comment") {
            return "commented on your post";
        }

        return "interacted with you";
    };

    if (loading) {
        return (
            <div className="notifications-page">
                Loading notifications...
            </div>
        );
    }

    if (error) {
        return (
            <div className="notifications-page">
                {error}
            </div>
        );
    }

    return (
        <div className="notifications-page">
            <h2>Notifications</h2>

            {notifications.length === 0 ? (
                <p className="empty-notifications">
                    No notifications yet.
                </p>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification) => {
                        const destination =
                            (notification.type === "like" ||
                                notification.type === "comment") &&
                            notification.post?._id
                                ? "/"
                                : notification.sender?.username
                                    ? `/profile/${notification.sender.username}`
                                    : "/";

                        return (
                            <Link
                                key={notification._id}
                                to={destination}
                                className={`notification-item ${
                                    !notification.isRead ? "unread" : ""
                                }`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    handleNotificationClick(notification);
                                }}
                            >
                                <div className="notification-avatar">
                                    {notification.sender?.profilePicture ? (
                                        <img
                                            src={notification.sender.profilePicture}
                                            alt=""
                                        />
                                    ) : (
                                        notification.sender?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"
                                    )}
                                </div>

                                <div className="notification-content">
                                    <p>
                                        <strong>
                                            {notification.sender?.username
                                                ? `@${notification.sender.username}`
                                                : "Someone"}
                                        </strong>{" "}
                                        {getMessage(notification)}
                                    </p>

                                    <span>
                                        {new Date(
                                            notification.createdAt
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                {!notification.isRead && (
                                    <span className="unread-dot"></span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Notifications;
