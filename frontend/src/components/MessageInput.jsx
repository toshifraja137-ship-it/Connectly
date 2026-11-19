import { useRef, useState } from "react";
import "../styles/chat.css";

function MessageInput({ onSend }) {
    const [text, setText] = useState("");
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageError, setImageError] = useState("");
    const fileInputRef = useRef(null);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed && selectedImages.length === 0) return;
        onSend({ text: trimmed, imageFiles: selectedImages });
        setText("");
        setSelectedImages([]);
        setImageError("");
    };

    const handleImagePick = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (!files.length) return;

        if (files.some((file) => !file.type.startsWith("image/"))) {
            setImageError("Please select image files only.");
            return;
        }
        if (files.some((file) => file.size > 5 * 1024 * 1024)) {
            setImageError("Each image must be 5 MB or smaller.");
            return;
        }
        if (selectedImages.length + files.length > 10) {
            setImageError("You can attach up to 10 images per message.");
            return;
        }

        setImageError("");
        setSelectedImages((previousImages) => [...previousImages, ...files]);
    };

    const removeImage = (indexToRemove) => {
        setSelectedImages((previousImages) =>
            previousImages.filter((_, index) => index !== indexToRemove)
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-bar">
            <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                </svg>
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImagePick}
            />

            {selectedImages.length > 0 && (
                <div className="chat-image-selection">
                    {selectedImages.map((file, index) => (
                        <div className="chat-image-selection-item" key={`${file.name}-${index}`}>
                            <span title={file.name}>{file.name}</span>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                aria-label={`Remove ${selectedImages[index].name}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <textarea
                className="chat-input"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{
                    height: "auto",
                    minHeight: "44px",
                    maxHeight: "120px"
                }}
            />
            <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!text.trim() && selectedImages.length === 0}
                aria-label="Send message"
            >
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
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 2L22 2Z" />
                </svg>
            </button>
            {imageError && (
                <span className="chat-upload-error" role="alert">
                    {imageError}
                </span>
            )}
        </div>
    );
}

export default MessageInput;