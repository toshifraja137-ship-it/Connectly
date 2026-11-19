import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useToast } from "../hooks/useToast";
import { ChatListSkeleton } from "../components/Skeleton";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/chat.css";

function Chat() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [messageStatus, setMessageStatus] = useState({}); // { messageId: "sent" | "delivered" | "seen" }
    const activeChatRef = useRef(activeChat);
    const socketRef = useRef(null);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
        }
    }, [user, navigate]);

    // Fetch the user's chat list
    const fetchChats = async () => {
        try {
            const response = await api.get("/chats");
            const fetchedChats = response.data.chats || [];
            setChats(fetchedChats);

            // If we have chats but none selected, default to the first one
            if (fetchedChats.length > 0 && !activeChatRef.current) {
                setActiveChat(fetchedChats[0]);
            }
        } catch (err) {
            console.error("Fetch chats error:", err);
            setError("Unable to load your conversations.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for the active chat
    const fetchMessages = async (chatId) => {
        try {
            const response = await api.get(
                `/chats/${chatId}/messages`
            );
            setMessages(response.data.messages || []);
        } catch (err) {
            console.error("Fetch messages error:", err);
            setError("Unable to load messages.");
        }
    };

    // Initial load
    useEffect(() => {
        if (!user) return;
        fetchChats();
    }, [user]);

    useEffect(() => {
        if (!user || !token) return;

        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const socket = io(apiUrl.replace(/\/api\/?$/, ""), {
            auth: { token }
        });
        socketRef.current = socket;

        // Join the active chat room when it changes
        if (activeChat) {
            socket.emit("chat:join", { chatId: activeChat._id });
        }

        socket.on("chat:message", ({ chatId, message }) => {
            const senderId = message.sender?._id || message.sender;
            const currentUserId = user?._id || user?.id;

            const lastMessage =
                message.text ||
                (message.images?.length || message.image
                    ? `Sent ${message.images?.length || 1} photo${(message.images?.length || 1) === 1 ? "" : "s"}`
                    : "Shared a post");

            setChats((previousChats) => {
                return previousChats
                    .map((chat) =>
                        chat._id === chatId
                            ? {
                                  ...chat,
                                  lastMessage,
                                  lastMessageAt: message.createdAt
                              }
                            : chat
                    )
                    .sort(
                        (first, second) =>
                            new Date(second.lastMessageAt) -
                            new Date(first.lastMessageAt)
                    );
            });
            fetchChats();

            if (
                String(senderId) !== String(currentUserId) &&
                activeChatRef.current?._id === chatId
            ) {
                setMessages((previousMessages) =>
                    previousMessages.some((item) => item._id === message._id)
                        ? previousMessages
                        : [...previousMessages, message]
                );
            }
        });

        socket.on(
            "chat:message_updated",
            ({ chatId, message, chatPreview }) => {
                setMessages((previousMessages) =>
                    previousMessages.map((item) =>
                        item._id === message._id ? message : item
                    )
                );
                setChats((previousChats) =>
                    previousChats.map((chat) =>
                        chat._id === chatId
                            ? { ...chat, ...chatPreview }
                            : chat
                    )
                );
            }
        );

        socket.on(
            "chat:message_deleted",
            ({ chatId, messageId, chatPreview }) => {
                setMessages((previousMessages) =>
                    previousMessages.filter((item) => item._id !== messageId)
                );
                setChats((previousChats) =>
                    previousChats.map((chat) =>
                        chat._id === chatId
                            ? { ...chat, ...chatPreview }
                            : chat
                    )
                );
            }
        );

        socket.on("connect_error", (socketError) => {
            console.error("Chat socket connection error:", socketError.message);
        });

        // Message status updates
        socket.on("chat:message_delivered", ({ messageId }) => {
            setMessageStatus((prev) => ({
                ...prev,
                [messageId]: "delivered"
            }));
        });

        socket.on("chat:message_seen", ({ messageId }) => {
            setMessageStatus((prev) => ({
                ...prev,
                [messageId]: "seen"
            }));
        });

        return () => socket.disconnect();
    }, [user, token]);

    // Join chat room when activeChat changes
    useEffect(() => {
        if (socketRef.current && activeChat) {
            socketRef.current.emit("chat:join", { chatId: activeChat._id });
        }
    }, [activeChat]);

    // Load messages when the active chat changes
    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat._id);
        }
    }, [activeChat]);

    // Send a new message
    const handleSendMessage = async ({ text, imageFiles = [] } = {}) => {
        if (!activeChat) return;

        const trimmedText = typeof text === "string" ? text.trim() : "";
        if (!trimmedText && imageFiles.length === 0) return;
        const imagePreviews = imageFiles.map((file) =>
            URL.createObjectURL(file)
        );

        const optimisticMessage = {
            _id: "temp-" + Date.now(),
            chat: activeChat._id,
            sender: {
                _id: user._id,
                name: user.name,
                username: user.username,
                profilePicture: user.profilePicture
            },
            text: trimmedText,
            images: imagePreviews,
            createdAt: new Date().toISOString(),
            isRead: true
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        setChats((prev) =>
            prev.map((chat) =>
                chat._id === activeChat._id
                    ? {
                          ...chat,
                          lastMessage:
                              trimmedText ||
                              `Sent ${imageFiles.length} photo${imageFiles.length === 1 ? "" : "s"}`,
                          lastMessageAt: new Date().toISOString()
                      }
                    : chat
            )
        );

        try {
            const formData = new FormData();
            if (trimmedText) formData.append("text", trimmedText);
            imageFiles.forEach((file) => formData.append("images", file));

            const response = await api.post(
                `/chats/${activeChat._id}/messages`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            const sentMessage = response.data.message;

            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === optimisticMessage._id
                        ? sentMessage
                        : msg
                )
            );
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        } catch (err) {
            console.error("Send message error:", err);
            setMessages((prev) =>
                prev.filter(
                    (msg) => msg._id !== optimisticMessage._id
                )
            );
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
            setError("Failed to send message.");
        }
    };

    const handleEditMessage = async (messageId, text) => {
        if (!activeChat) return false;

        try {
            const response = await api.put(
                `/chats/${activeChat._id}/messages/${messageId}`,
                { text }
            );
            setMessages((previousMessages) =>
                previousMessages.map((message) =>
                    message._id === messageId
                        ? response.data.updatedMessage
                        : message
                )
            );
            setChats((previousChats) =>
                previousChats.map((chat) =>
                    chat._id === activeChat._id
                        ? { ...chat, ...response.data.chatPreview }
                        : chat
                )
            );
            return true;
        } catch (err) {
            console.error("Edit message error:", err);
            toast.error(
                err.response?.data?.message || "Failed to edit message."
            );
            return false;
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!activeChat) return;

        try {
            const response = await api.delete(
                `/chats/${activeChat._id}/messages/${messageId}`
            );
            setMessages((previousMessages) =>
                previousMessages.filter((message) => message._id !== messageId)
            );
            setChats((previousChats) =>
                previousChats.map((chat) =>
                    chat._id === activeChat._id
                        ? { ...chat, ...response.data.chatPreview }
                        : chat
                )
            );
        } catch (err) {
            console.error("Delete message error:", err);
            window.alert(
                err.response?.data?.message || "Failed to unsend message."
            );
        }
    };

    // A new chat was started from the sidebar search
    const handleChatStarted = (newChat) => {
        setChats((prev) => {
            // Avoid duplicates
            const exists = prev.some(
                (chat) => chat._id === newChat._id
            );
            if (exists) return prev;
            return [newChat, ...prev];
        });
        setActiveChat(newChat);
        setMessages([]);
    };

    const handleChatSelect = (chat) => {
        activeChatRef.current = chat;
        setMessages([]);
        setActiveChat(chat);
    };

    if (loading) {
        return (
            <div className="chat-page">
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <h2>Messages</h2>
                    </div>
                    <div className="chat-list">
                        <ChatListSkeleton />
                        <ChatListSkeleton />
                        <ChatListSkeleton />
                    </div>
                </div>
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
            </div>
        );
    }

    if (error) {
        return (
            <div className="chat-page">
                <div className="chat-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            <ChatSidebar
                chats={chats}
                activeChatId={activeChat?._id}
                onSelect={handleChatSelect}
                onChatStarted={handleChatStarted}
            />
            <ChatWindow
                chat={activeChat}
                messages={messages}
                currentUserId={user?._id || user?.id}
                onSend={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                messageStatus={messageStatus}
                socket={socketRef.current}
            />
        </div>
    );
}

export default Chat;