import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import "../styles/home.css";

function EditPostModal({ post, open, onClose, onSave }) {
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const textareaRef = useRef(null);

    // Focus the textarea once it's visible
    useEffect(() => {
        if (open && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            );
        }
    }, [open]);

    if (!open || !post) return null;

    const captionValue = post.caption || "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const trimmed = caption.trim();
        if (!trimmed) {
            setError("Caption cannot be empty.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await api.put(`/posts/${post._id}`, {
                caption: trimmed
            });

            // Update the post in the parent's state
            onSave(post._id, response.data.post);
            onClose();
        } catch (err) {
            console.error("Edit post error:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to update post. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div
                className="edit-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="edit-modal-header">
                    <h3>Edit post</h3>
                    <button
                        className="edit-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-modal-form">
                    <textarea
                        ref={textareaRef}
                        value={captionValue}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength={2200}
                        rows={5}
                        placeholder="Edit your caption"
                    />
                    <div className="edit-char-count">
                        {captionValue.length} / 2200
                    </div>

                    {error && (
                        <p className="edit-modal-error">{error}</p>
                    )}

                    <div className="edit-modal-actions">
                        <button
                            type="button"
                            className="edit-modal-cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="edit-modal-save"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditPostModal;