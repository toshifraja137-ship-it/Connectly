
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/profile.css";

function EditProfile() {
    const navigate = useNavigate();
    const { user, login, token } = useAuth();

    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [email, setEmail] = useState("");
    const [profilePicture, setProfilePicture] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [picError, setPicError] = useState("");
    const [picUploading, setPicUploading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/users/me");
                const profile = response.data.user;

                setName(profile.name || "");
                setBio(profile.bio || "");
                setEmail(profile.email || "");
                setProfilePicture(profile.profilePicture || "");
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setPicError("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPicError("Image must be 5 MB or smaller.");
            return;
        }

        setPicUploading(true);
        setPicError("");

        try {
            const formData = new FormData();
            formData.append("profilePicture", file);

            const response = await api.post(
                "/users/me/profile-picture",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" }
                }
            );

            const newUrl = response.data.profilePicture;
            setProfilePicture(newUrl);
            login({ ...user, profilePicture: newUrl }, token);
            setSuccess("Profile picture updated!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setPicError(
                err.response?.data?.message ||
                    "Unable to upload profile picture."
            );
        } finally {
            setPicUploading(false);
        }
    };

    const handleRemoveProfilePicture = async () => {
        if (!window.confirm("Remove your profile picture?")) return;

        setPicUploading(true);
        setPicError("");

        try {
            const response = await api.delete("/users/me/profile-picture");
            setProfilePicture("");
            login({ ...user, profilePicture: "" }, token);
            setSuccess("Profile picture removed!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setPicError(
                err.response?.data?.message ||
                    "Unable to remove profile picture."
            );
        } finally {
            setPicUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        try {
            setSaving(true);

            const response = await api.put("/users/me", {
                name: name.trim(),
                bio: bio.trim()
            });

            const updatedUser = response.data.user;

            // Update the logged-in user in AuthContext
            login(
                { ...user, ...updatedUser },
                token
            );

            setSuccess("Profile updated successfully!");

            setTimeout(() => {
                navigate(`/profile/${updatedUser.username}`);
            }, 1000);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="profile-message">Loading profile...</p>;
    }

    return (
        <main className="edit-profile-container">
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                <h1>Edit Profile</h1>
                <p>Update your personal information.</p>

                {error && (
                    <div className="edit-error">{error}</div>
                )}

                {success && (
                    <div className="edit-success">{success}</div>
                )}

                <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={50}
                    required
                />

                <label>Profile Picture</label>
                <div className="profile-picture-upload">
                    <div className="profile-picture-preview">
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile preview" />
                        ) : (
                            <div className="profile-picture-placeholder">
                                {name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}
                    </div>
                    <div className="profile-picture-actions">
                        <label className="profile-picture-btn">
                            {picUploading ? "Uploading..." : "Change Photo"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                hidden
                            />
                        </label>
                        {profilePicture && (
                            <button
                                type="button"
                                className="profile-picture-remove"
                                onClick={handleRemoveProfilePicture}
                                disabled={picUploading}
                            >
                                Remove Photo
                            </button>
                        )}
                        {picError && (
                            <p className="profile-picture-error">
                                {picError}
                            </p>
                        )}
                    </div>
                </div>

                <label>Username</label>
                <input
                    type="text"
                    value={user?.username || ""}
                    disabled
                />

                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    disabled
                />

                <label>Bio</label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people something about yourself..."
                    rows={4}
                    maxLength={250}
                />

                <button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                    type="button"
                    className="cancel-edit-btn"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </button>
            </form>
        </main>
    );
}

export default EditProfile;
