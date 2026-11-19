
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import CommentSection from "../components/CommentSection";
import EditPostModal from "../components/EditPostModal";
import PostGallery from "../components/PostGallery";
import ShareButton from "../components/ShareButton";
import { PostSkeleton } from "../components/Skeleton";
import "../styles/home.css";

const PAGE_SIZE = 10;

function Home() {
    const { user } = useAuth();
    const toast = useToast();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [followLoadingId, setFollowLoadingId] = useState(null);
    const [likeLoadingId, setLikeLoadingId] = useState(null);
    const [editPost, setEditPost] = useState(null); // post object being edited
    const [editOpen, setEditOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const sentinelRef = useRef(null);

    
        const fetchPosts = async (page = 1) => {
            try {
                const response = await api.get(
                    `/posts?page=${page}&limit=${PAGE_SIZE}`
                );
                const newPosts = response.data.posts || [];
                setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
                setHasMore(newPosts.length >= PAGE_SIZE);
                if (page === 1) setLoading(false);
                else setLoadingMore(false);
            } catch (err) {
                console.error("Error fetching posts:", err);
                setError("Unable to load posts. Please try again.");
                setLoading(false);
                setLoadingMore(false);
            }
        };

const loadMore = () => {
            if (!loadingMore && hasMore) {
                setPage((prev) => prev + 1);
                fetchPosts(page + 1);
            }
        };

useEffect(() => {
        fetchPosts(1);
    }, []);

useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );
        const current = sentinelRef.current;
        if (current) observer.observe(current);
        return () => {
            if (current) observer.disconnect();
        };
    }, [hasMore, loadingMore]);

    useEffect(() => {
    const targetPostId = location.state?.postId;

    if (!targetPostId || posts.length === 0) return;

    const targetPost = document.getElementById(
        `post-${targetPostId}`
    );

    if (targetPost) {
        targetPost.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        targetPost.classList.add("highlight-post");

        setTimeout(() => {
            targetPost.classList.remove("highlight-post");
        }, 2500);
    }

    navigate(location.pathname, {
        replace: true,
        state: null
    });

}, [posts, location.state, location.pathname, navigate]);

    const handleFollowToggle = async (postUser) => {
        if (!user || followLoadingId) return;

        const userId = postUser._id;

        try {
            setFollowLoadingId(userId);

            if (postUser.isFollowing) {
                await api.post(`/users/${userId}/unfollow`);
            } else {
                await api.post(`/users/${userId}/follow`);
            }

            // Update every post belonging to this user
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.user?._id === userId
                        ? {
                            ...post,
                            isFollowing: !post.isFollowing
                        }
                        : post
                )
            );

        } catch (err) {
            console.error("Follow error:", err);
            toast.error(
                err.response?.data?.message ||
                "Unable to update follow status."
            );
        } finally {
            setFollowLoadingId(null);
        }
    };

    const handleLikeToggle = async (postId) => {
    if (!user || likeLoadingId) return;

    try {
        setLikeLoadingId(postId);

        const response = await api.put(`/posts/${postId}/like`);

        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post._id === postId
                    ? {
                        ...post,
                        likesCount: response.data.likesCount,
                        isLiked: response.data.isLiked
                    }
                    : post
            )
        );

    } catch (err) {
        console.error("Like error:", err);

        toast.error(
            err.response?.data?.message ||
            "Unable to update like."
        );
    } finally {
        setLikeLoadingId(null);
    }
};

const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    try {
        await api.delete(`/posts/${postId}`);

        setPosts((prevPosts) =>
            prevPosts.filter((post) => post._id !== postId)
        );

    } catch (err) {
        console.error("Delete post error:", err);

        toast.error(
            err.response?.data?.message ||
            "Unable to delete post."
        );
    }
};

const handleEditSave = (postId, updatedPost) => {
    setPosts((prevPosts) =>
        prevPosts.map((post) =>
            post._id === postId ? { ...post, ...updatedPost } : post
        )
    );
};

const openEditModal = (post) => {
    setEditPost(post);
    setEditOpen(true);
};

const closeEditModal = () => {
    setEditOpen(false);
    setEditPost(null);
};

    if (loading) {
        return (
            <main className="home-container">
                <section className="feed">
                    <h1>Home Feed</h1>
                    <p className="feed-subtitle">
                        See what's happening in your community.
                    </p>
                    {[...Array(3)].map((_, i) => (
                        <PostSkeleton key={i} />
                    ))}
                </section>
            </main>
        );
    }

    if (error) {
        return <p className="feed-message">{error}</p>;
    }

    return (
        <main className="home-container">
            <section className="feed">
                <h1>Home Feed</h1>
                <p className="feed-subtitle">
                    See what's happening in your community.
                </p>

                {posts.length === 0 ? (
                    <p className="feed-message">
                        No posts yet. Be the first to share something!
                    </p>
                ) : (
                    posts.map((post) => {
                        const postUser = post.user;

                        const isOwnPost =
                            user &&
                            (
                                user._id === postUser?._id ||
                                user.id === postUser?._id ||
                                user.username === postUser?.username
                            );

                        return (
                            <article
                                        className="post-card"
                                        key={post._id}
                                        id={`post-${post._id}`}
                                    >
                                <ShareButton
                                    postId={post._id}
                                    user={post.user}
                                />
                                <div className="post-header">
                                    <div className="avatar">
                                        {postUser?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>

                                    <div className="post-author">
                                        <h3>{postUser?.name || "Unknown User"}</h3>
                                        <span>
                                            @{postUser?.username || "unknown"}
                                        </span>
                                    </div>

                                    {user && !isOwnPost && (
                                        <button
                                            className={`feed-follow-btn ${
                                                post.isFollowing ? "following" : ""
                                            }`}
                                            onClick={() =>
                                                handleFollowToggle({
                                                    ...postUser,
                                                    isFollowing: post.isFollowing
                                                })
                                            }
                                            disabled={followLoadingId === postUser?._id}
                                        >
                                            {followLoadingId === postUser?._id
                                                ? "Please wait..."
                                                : post.isFollowing
                                                    ? "Following"
                                                    : "Follow"}
                                        </button>
                                    )}

                                    {isOwnPost && (
                                        <button
                                            className="edit-post-btn"
                                            onClick={() => openEditModal(post)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {isOwnPost && (
                                        <button
                                            className="delete-post-btn"
                                            onClick={() => handleDeletePost(post._id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>

                                {post.caption && (
                                    <p className="post-caption">
                                        {post.caption}
                                    </p>
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


                            <div className="post-footer">
   <button
    className={`like-btn ${post.isLiked ? "liked" : ""}`}
    onClick={() => handleLikeToggle(post._id)}
    disabled={likeLoadingId === post._id}
    aria-label={post.isLiked ? "Unlike post" : "Like post"}
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill={post.isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>

    <span>{post.likesCount || 0} Likes</span>
</button>

                                <CommentSection
    postId={post._id}
    user={user}
    commentCount={post.commentsCount || 0}
/>
</div>                               

                            </article>
                        );
                    })
                )}
                {hasMore && (
                    <div ref={sentinelRef} className="infinite-scroll-sentinel">
                        {loadingMore && (
                            <div className="loading-more">
                                <div className="skeleton" style={{ width: 32, height: 32, margin: "0 auto 8px" }} />
                                <p style={{ textAlign: "center", color: "#64748b" }}>
                                    Loading more posts...
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {!hasMore && posts.length > 0 && (
                    <p className="feed-end">
                        You've reached the end of the feed.
                    </p>
                )}
            </section>

                <EditPostModal
                    post={editPost}
                    open={editOpen}
                    onClose={closeEditModal}
                    onSave={handleEditSave}
                />
            </main>
        );
    }

export default Home;
