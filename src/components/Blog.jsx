import { useEffect, useMemo, useRef } from "react";
import { loadPosts } from "../utils/fetchFiles.jsx";
import { fmtLong } from "../utils/parseMarkdown.js";
import "./Blog.css";

export default function Blog() {
    const posts = useMemo(loadPosts, []);
    const scrollerRef = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        const scroller = scrollerRef.current;
        const track = trackRef.current;
        if (!scroller || !track || posts.length === 0) return;

        let raf = 0;

        function update() {
            raf = 0;
            const rect = scroller.getBoundingClientRect();
            const vh = window.innerHeight;
            const scrollable = rect.height - vh;
            const progress =
                scrollable > 0
                    ? Math.min(1, Math.max(0, -rect.top / scrollable))
                    : 0;
            const shift = progress * (posts.length - 1) * window.innerWidth;
            track.style.transform = `translate3d(${-shift}px, 0, 0)`;
        }

        function onScrollOrResize() {
            if (raf) return;
            raf = requestAnimationFrame(update);
        }

        update();
        window.addEventListener("scroll", onScrollOrResize, {
            passive: true,
        });
        window.addEventListener("resize", onScrollOrResize);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScrollOrResize);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, [posts.length]);

    if (posts.length === 0) return null;

    return (
        <div
            className="blog-scroller"
            ref={scrollerRef}
            style={{ height: `${posts.length * 100}dvh` }}
        >
            <div className="blog-sticky">
                <div
                    className="blog-track"
                    ref={trackRef}
                >
                    {posts.map((post, i) => (
                        <article
                            className="post  section--b"
                            key={post.date + i}
                        >
                            <div className="header">
                                <h1>{post.title}</h1>
                            </div>
                            <div className="header sub b">
                                <p className="t-code">
                                    <em>
                                        {fmtLong(post.date)}
                                        {post.location
                                            ? ` — ${post.location}`
                                            : ""}
                                    </em>
                                </p>
                            </div>
                            <div
                                className="content-body shorter b"
                                dangerouslySetInnerHTML={{ __html: post.html }}
                            />
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
