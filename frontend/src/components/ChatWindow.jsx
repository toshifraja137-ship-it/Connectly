import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MessageInput from "./MessageInput";
import "../styles/chat.css";

function ChatWindow({
    chat,
    messages,
    currentUserId,
    onSend,
    onEditMessage,
    onDeleteMessage,
    messageStatus,
    socket
}) {
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const [openActionsId, setOpenActionsId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState("");

    const otherUser = chat?.user;
    const getInitials = (person) => {
        if (!person) return "U";
        return (
            person.name?.charAt(0)?.toUpperCase() ||
            person.username?.charAt(0)?.toUpperCase() ||
            "U"
        );
    };

    const formatTime = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString([], {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    // Group messages by day for date separators
    const groupMessagesByDay = (msgs) => {
        const groups = [];
        let currentDate = null;

        for (const msg of msgs) {
            const msgDate = new Date(msg.createdAt).toDateString();
            if (msgDate !== currentDate) {
                groups.push({ date: msgDate, messages: [] });
                currentDate = msgDate;
            }
            groups[groups.length - 1].messages.push(msg);
        }
        return groups;
    };

    const groups = groupMessagesByDay(messages || []);

    const startEditing = (message) => {
        setEditingMessageId(message._id);
        setEditText(message.text);
        setOpenActionsId(null);
    };

    const saveEdit = async (event, messageId) => {
        event.preventDefault();
        const updated = await onEditMessage(messageId, editText);
        if (updated) {
            setEditingMessageId(null);
            setEditText("");
        }
    };

    const deleteMessage = (messageId) => {
        if (!window.confirm("Unsend this message for everyone?")) return;
        setOpenActionsId(null);
        onDeleteMessage(messageId);
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!chat) {
        return (
            <div className="chat-window-empty">
                <div className="chat-empty-state">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3>Select a conversation</h3>
                    <p>Choose a chat from the left to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-window-header">
                <div className="chat-window-avatar">
                    {otherUser?.profilePicture ? (
                        <img src={otherUser.profilePicture} alt="" />
                    ) : (
                        getInitials(otherUser)
                    )}
                </div>
                <div className="chat-window-info">
                    <h3>
                        {otherUser?.name || otherUser?.username || "User"}
                    </h3>
                    <span className="chat-window-status">
                        @{otherUser?.username}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty-hint">
                        <p>No messages yet.</p>
                        <p>Send the first message to start the conversation!</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div className="chat-message-group" key={group.date}>
                            <div className="chat-date-separator">
                                <span>{formatDate(group.messages[0].createdAt)}</span>
                            </div>
                            {group.messages.map((msg, index) => {
                                const senderId = msg.sender?._id || msg.sender?.id;
                                const isMine =
                                    senderId != null &&
                                    currentUserId != null &&
                                    String(senderId) === String(currentUserId);
                                const previousSender =
                                    group.messages[index - 1]?.sender;
                                const previousSenderId =
                                    previousSender?._id || previousSender?.id;
                                const showSender =
                                    !isMine &&
                                    (index === 0 ||
                                        String(previousSenderId) !== String(senderId));
                                const messageImages = msg.images?.length
                                    ? msg.images
                                    : msg.image
                                      ? [msg.image]
                                      : [];

                                return (
                                    <div
                                        key={msg._id}
                                        className={`chat-message-row ${
                                            isMine ? "mine" : "theirs"
                                        }`}
                                    >
                                        {!isMine && (
                                            <div className="chat-message-avatar">
                                                {msg.sender?.profilePicture ? (
                                                    <img
                                                        src={
                                                            msg.sender
                                                                .profilePicture
                                                        }
                                                        alt=""
                                                    />
                                                ) : (
                                                    getInitials(msg.sender)
                                                )}
                                            </div>
                                        )}
                                        <div className="chat-message-bubble">
                                            {showSender && (
                                                <span className="chat-message-sender">
                                                    {msg.sender?.name ||
                                                        msg.sender?.username}
                                                </span>
                                            )}
                                            {msg.text && (
                                                editingMessageId === msg._id ? (
                                                    <form
                                                        className="chat-edit-form"
                                                        onSubmit={(event) =>
                                                            saveEdit(event, msg._id)
                                                        }
                                                    >
                                                        <textarea
                                                            value={editText}
                                                            onChange={(event) =>
                                                                setEditText(event.target.value)
                                                            }
                                                            maxLength={1000}
                                                            autoFocus
                                                            aria-label="Edit message"
                                                        />
                                                        <div className="chat-edit-actions">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingMessageId(null);
                                                                    setEditText("");
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={!editText.trim()}
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        {isMine ? (
                                                            <button
                                                                type="button"
                                                                className="chat-message-text chat-message-text-trigger"
                                                                onClick={() =>
                                                                    setOpenActionsId(
                                                                        openActionsId === msg._id
                                                                            ? null
                                                                            : msg._id
                                                                    )
                                                                }
                                                            >
                                                                {msg.text}
                                                            </button>
                                                        ) : (
                                                            <div className="chat-message-text">
                                                                {msg.text}
                                                            </div>
                                                        )}
                                                        {isMine && openActionsId === msg._id && (
                                                            <div className="chat-message-actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditing(msg)}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="delete"
                                                                    onClick={() =>
                                                                        deleteMessage(msg._id)
                                                                }
                                                                >
                                                                    Unsend
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )
                                            )}
                                        </div>

                                        {messageImages.length > 0 && (
                                            <div
                                                className={`chat-message-images ${
                                                    messageImages.length === 1
                                                        ? "single"
                                                        : ""
                                                }`}
                                            >
                                                {messageImages.map((image, imageIndex) => (
                                                    <img
                                                        key={`${msg._id}-${imageIndex}`}
                                                        src={image}
                                                        alt={`Shared photo ${imageIndex + 1}`}
                                                        className="chat-message-image"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {msg.post && (
                                            <button
                                                type="button"
                                                className="chat-message-post"
                                                onClick={() =>
                                                    navigate("/", {
                                                        state: {
                                                            postId: msg.post._id
                                                        }
                                                    })
                                                }
                                            >
                                                <span className="chat-message-post-label">
                                                    Shared a post
                                                </span>
                                                {msg.post.images &&
                                                    msg.post.images.length > 0 && (
                                                        <img
                                                            src={
                                                                msg.post
                                                                    .images[0]
                                                            }
                                                            alt="Shared post"
                                                            className="chat-message-post-image"
                                                        />
                                                    )}
                                                <div className="chat-message-post-content">
                                                    <strong>
                                                        {msg.post.user?.name ||
                                                            "Shared post"}
                                                    </strong>
                                                    <p>
                                                        {msg.post.caption ||
                                                            "View the full post"}
                                                    </p>
                                                </div>
                                            </button>
                                        )}

                                        <span className="chat-message-time">
                                            {formatTime(
                                                msg.createdAt
                                            )}
                                        </span>
                                        {isMine && (
                                            <span
                                                className={`chat-message-status ${messageStatus[msg._id] || "sent"}`}
                                            >
                                                {messageStatus[msg._id] === "seen"
                                                    ? "✓✓"
                                                    : messageStatus[msg._id] === "delivered"
                                                    ? "✓✓"
                                                    : "✓"}
                                            </span>
                                        )}
                                                                            </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput onSend={onSend} socket={socket} chatId={chat._id} />
        </div>
    );
}

function formatTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

export default ChatWindow;