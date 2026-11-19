import { useEffect, useRef, useState } from "react";
import "../styles/home.css";

function PostGallery({ images }) {
    const urls = images && images.length > 0 ? images : [];
    const [index, setIndex] = useState(0);
    const containerRef = useRef(null);

    // Reset the index if it ever exceeds the number of images
    useEffect(() => {
        if (urls.length === 0) return;
        if (index >= urls.length) {
            setIndex(Math.max(0, urls.length - 1));
        }
    }, [index, urls.length]);

    if (urls.length === 0) return null;

    const prev = () => {
        setIndex((i) => (i - 1 + urls.length) % urls.length);
    };

    const next = () => {
        setIndex((i) => (i + 1) % urls.length);
    };

    const go = (i) => setIndex(i);

    // Keyboard navigation while the gallery is focused
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleKey = (e) => {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
            }
        };

        el.addEventListener("keydown", handleKey);
        return () => el.removeEventListener("keydown", handleKey);
    }, [index, urls.length]);

    return (
        <div
            className="post-image-gallery"
            ref={containerRef}
            tabIndex={0}
            aria-label="Post image gallery"
        >
            {urls.length > 1 && (
                <button
                    className="gallery-nav gallery-nav-left"
                    onClick={prev}
                    aria-label="Previous image"
                >
                    ‹
                </button>
            )}

            <div className="gallery-slides" style={{ transform: `translateX(-${index * 100}%)` }}>
                {urls.map((url, idx) => (
                    <div key={idx} className="gallery-slide">
                        <img
                            src={url}
                            alt={`Post ${idx + 1}`}
                            className="post-image"
                        />
                    </div>
                ))}
            </div>

            {urls.length > 1 && (
                <button
                    className="gallery-nav gallery-nav-right"
                    onClick={next}
                    aria-label="Next image"
                >
                    ›
                </button>
            )}

            {urls.length > 1 && (
                <span className="post-image-count">
                    {index + 1} / {urls.length}
                </span>
            )}

            {urls.length > 1 && (
                <div className="gallery-dots">
                    {urls.map((_, idx) => (
                        <button
                            key={idx}
                            className={`gallery-dot${
                                idx === index ? " active" : ""
                            }`}
                            onClick={() => go(idx)}
                            aria-label={`Go to image ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default PostGallery;