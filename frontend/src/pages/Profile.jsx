
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PostGallery from "../components/PostGallery";
import { ProfileSkeleton } from "../components/Skeleton";
import "../styles/profile.css";

function Profile() {
    const { username } = useParams();
    const { user: loggedInUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [followLoading, setFollowLoading] = useState(false);
const [followError, setFollowError] = useState("");

    const isOwnProfile =
        loggedInUser?.username === username;

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError("");

            try {
                // Fetch profile information
                const profileResponse = await api.get(
                    `/users/${username}`
                );

                const profileData = profileResponse.data.user;
                setProfile(profileData);

                // Fetch posts by user ID
                const postsResponse = await api.get(
                    `/posts/user/${profileData.id}`
                );

                setPosts(postsResponse.data.posts || []);

            } catch (err) {
                console.error("Profile error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load profile"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    const handleFollowToggle = async () => {
    if (!loggedInUser || !profile || followLoading) return;

    setFollowLoading(true);
    setFollowError("");

    try {
        if (profile.isFollowing) {
            await api.post(`/users/${profile.id}/unfollow`);

            setProfile((prev) => ({
                ...prev,
                isFollowing: false,
                followersCount: prev.followersCount - 1
            }));
        } else {
            await api.post(`/users/${profile.id}/follow`);

            setProfile((prev) => ({
                ...prev,
                isFollowing: true,
                followersCount: prev.followersCount + 1
            }));
        }
    } catch (error) {
        setFollowError(
            error.response?.data?.message || "Unable to update follow status."
        );
    } finally {
        setFollowLoading(false);
    }
};

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (error) {
        return <p className="profile-message">{error}</p>;
    }

    if (!profile) {
        return <p className="profile-message">User not found</p>;
    }

    return (
        <main className="profile-container">

            <section className="profile-header">

                <div className="profile-picture">
                    {profile.profilePicture ? (
                        <img
                            src={profile.profilePicture}
                            alt={profile.name}
                        />
                    ) : (
                        profile.name?.charAt(0).toUpperCase() || "U"
                    )}
                </div>

                <div className="profile-info">

                    <div className="profile-title">

                        {loggedInUser && !isOwnProfile && (
    <button
        className={`follow-btn ${profile.isFollowing ? "following" : ""}`}
        onClick={handleFollowToggle}
        disabled={followLoading}
    >
        {followLoading
            ? "Please wait..."
            : profile.isFollowing
                ? "Following"
                : "Follow"}
    </button>
)}
                        
                        <h1>{profile.name}</h1>

                        {isOwnProfile && (
                            <Link
                                to="/edit-profile"
                                className="edit-profile-btn"
                            >
                                Edit Profile
                            </Link>
                        )}
                    </div>

                    <p className="profile-username">
                        @{profile.username}
                    </p>

                    {followError && (
    <p className="follow-error">{followError}</p>
)}

                    <div className="profile-stats">
                        <span>
                            <strong>{posts.length}</strong> Posts
                        </span>

                        <span>
                            <strong>{profile.followersCount}</strong> Followers
                        </span>

                        <span>
                            <strong>{profile.followingCount}</strong> Following
                        </span>
                    </div>

                    <p className="profile-bio">
                        {profile.bio || "No bio added yet."}
                    </p>

                </div>

            </section>

            <section className="profile-posts">
                <h2>Posts</h2>

                {posts.length === 0 ? (
                    <p className="profile-message">
                        No posts yet.
                    </p>
                ) : (
                    posts.map((post) => (
                        <article className="profile-post-card" key={post._id}>

                            {post.caption && (
                                <p>{post.caption}</p>
                            )}

                            {(post.images && post.images.length > 0) || post.imageUrl ? (
                                <PostGallery
                                    images={
                                        post.images && post.images.length > 0
                                            ? post.images
                                            : [post.imageUrl]
                                    }
                                />
                            ) : null}

                            <div className="profile-post-stats">
                                ❤️ {post.likesCount || 0} Likes
                                {" · "}
                                💬 {post.commentsCount || 0} Comments
                            </div>

                        </article>
                    ))
                )}
            </section>

        </main>
    );
}

export default Profile;
