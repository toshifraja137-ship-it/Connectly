import "../styles/skeleton.css";

export function Skeleton({ width = "100%", height = 20, rounded = "8px", style = {} }) {
    return (
        <div
            className="skeleton"
            style={{ width, height, borderRadius: rounded, ...style }}
        />
    );
}

export function PostSkeleton() {
    return (
        <div className="post-card skeleton-card">
            <div className="post-header">
                <Skeleton width={48} height={48} rounded="50%" />
                <div style={{ flex: 1 }}>
                    <Skeleton width={140} height={18} style={{ marginBottom: 6 }} />
                    <Skeleton width={100} height={12} />
                </div>
            </div>
            <Skeleton height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={16} style={{ marginBottom: 12 }} />
            <Skeleton height={200} style={{ marginBottom: 12 }} />
            <div className="post-footer">
                <Skeleton width={80} height={24} />
                <Skeleton width={60} height={24} />
            </div>
        </div>
    );
}

export function ChatListSkeleton() {
    return (
        <div className="chat-list-item">
            <Skeleton width={48} height={48} rounded="50%" />
            <div style={{ flex: 1 }}>
                <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
                <Skeleton width={180} height={12} />
            </div>
        </div>
    );
}

export function CommentSkeleton() {
    return (
        <div className="comment-item">
            <Skeleton width={36} height={36} rounded="50%" />
            <div style={{ flex: 1 }}>
                <Skeleton width={100} height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="100%" height={12} style={{ marginBottom: 4 }} />
                <Skeleton width="60%" height={12} />
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="profile-container">
            <div className="profile-header">
                <Skeleton width={130} height={130} rounded="50%" />
                <div className="profile-info">
                    <Skeleton width={200} height={28} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={16} style={{ marginBottom: 16 }} />
                    <div className="profile-stats">
                        <Skeleton width={80} height={14} />
                        <Skeleton width={80} height={14} />
                        <Skeleton width={80} height={14} />
                    </div>
                </div>
            </div>
            <div className="profile-posts">
                <Skeleton width={120} height={22} style={{ marginBottom: 20 }} />
                <Skeleton height={16} style={{ marginBottom: 8 }} />
                <Skeleton height={200} />
            </div>
        </div>
    );
}

export default Skeleton;