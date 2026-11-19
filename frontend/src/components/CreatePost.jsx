import { useState } from "react";
import api from "../services/api";

function CreatePost({ onPostCreated }) {
    const [caption, setCaption] = useState("");
    const [images, setImages] = useState([]); // array of {file, preview}
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

        setImages((prev) => {
            const combined = [...prev, ...valid];
            // Cap at 10 images to match the server's upload limit
            return combined.slice(0, 10);
        });
        setError("");
    };

    const handleRemoveImage = (index) => {
        setImages((prev) => {
            const next = prev.filter((_, i) => i !== index);
            if (prev[index]) {
                URL.revokeObjectURL(prev[index].preview);
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!caption.trim() && images.length === 0) {
            setError("Please write a caption or select an image.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();

            formData.append("caption", caption);

            images.forEach((img) => {
                formData.append("image", img.file);
            });

            await api.post("/posts", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            // Revoke all object URLs before clearing
            images.forEach((img) => URL.revokeObjectURL(img.preview));

            setCaption("");
            setImages([]);
            onPostCreated();

        } catch (err) {
            console.error("Create post error:", err);

            setError(
                err.response?.data?.message ||
                    "Unable to create post. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-card">
            <h2>Create a post</h2>

            <form onSubmit={handleSubmit}>
                <textarea
                    placeholder="What's happening in your community?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows="3"
                />

                {images.length > 0 && (
                    <div className="image-preview-grid">
                        {images.map((img, index) => (
                            <div key={index} className="image-preview-item">
                                <img src={img.preview} alt={`Selected ${index + 1}`} />
                                <button
                                    type="button"
                                    className="image-preview-remove"
                                    onClick={() => handleRemoveImage(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="create-post-actions">
                    <label className="image-upload-btn">
                        + Add Photo
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            hidden
                        />
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? "Publishing..." : "Publish"}
                    </button>
                </div>

                {error && (
                    <p className="create-post-error">{error}</p>
                )}
            </form>
        </div>
    );
}

export default CreatePost;