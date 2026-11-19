import { useState } from "react";
import api from "../services/api";
import "../styles/navbar.css";

function CreatePostModal({ open, onClose, onPostCreated }) {
    const [caption, setCaption] = useState("");
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        const valid = [];
        for (const file of selectedFiles) {
            if (!file.type.startsWith("image/")) {
                setError("Only image files are allowed.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size must be less than 5 MB.");
                return;
            }
            valid.push({ file, preview: URL.createObjectURL(file) });
        }

        setImages((prev) => [...prev, ...valid].slice(0, 10));
        setError("");
    };

    const handleRemoveImage = (index) => {
        setImages((prev) => {
            const next = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index].preview);
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caption.trim() && images.length === 0) {
            setError("Please write a caption or select images.");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("caption", caption);
            images.forEach((img) => formData.append("image", img.file));

            await api.post("/posts", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            images.forEach((img) => URL.revokeObjectURL(img.preview));
            setCaption("");
            setImages([]);
            onPostCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="create-post-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create New Post</h3>
                    <button onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a caption..."
                    />
                    <div className="image-preview-grid">
                        {images.map((img, index) => (
                            <div key={index} className="preview-item">
                                <img src={img.preview} alt="preview" />
                                <button type="button" onClick={() => handleRemoveImage(index)}>✕</button>
                            </div>
                        ))}
                    </div>
                    <label className="upload-btn">
                        Select Images
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} hidden />
                    </label>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" disabled={loading} className="publish-btn">
                        {loading ? "Publishing..." : "Publish"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreatePostModal;