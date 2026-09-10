import { useState, useMemo } from "react";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import "./Blog.css";

const blogModules = import.meta.glob("../content/blog/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

const blogImages = import.meta.glob("../content/blog/imgs/*", {
    eager: true,
    import: "default",
});

function resolveImage(filename) {
    if (!filename) return null;
    const match = Object.entries(blogImages).find(([path]) =>
        path.endsWith(`/${filename}`),
    );
    return match ? match[1] : null;
}

function loadPosts() {
    return Object.entries(blogModules)
        .map(([, raw]) => {
            const { meta, body } = parseFrontmatter(raw);
            return {
                date: meta.date || "",
                title: meta.title || "Untitled",
                location: meta.location || "",
                img: resolveImage(meta.img),
                participants: meta.participants
                    ? JSON.parse(meta.participants)
                    : [],
                html: parseMarkdown(body),
            };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
}

function fmtShort(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(2)}`;
}

function fmtLong(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}.${m}.${y}`;
}

export default function Blog() {
    const posts = useMemo(loadPosts, []);
    const [activeIdx, setActiveIdx] = useState(0);
    const post = posts[activeIdx];
    if (!post) return null;

    return (
        <div className="blog">
            {/* Date sidebar */}
            <aside className="blog-sidebar">
                {posts.map((p, i) => (
                    <button
                        key={p.date + i}
                        className={`blog-date-btn${i === activeIdx ? " blog-date-btn--active" : ""}`}
                        onClick={() => setActiveIdx(i)}
                    >
                        {fmtShort(p.date)}
                    </button>
                ))}
            </aside>

            {/* Article */}
            <article className="blog-article">
                <header className="blog-article-header">
                    <h1 className="blog-article-title">{post.title}</h1>
                    <p className="blog-article-meta">
                        <em>
                            {fmtLong(post.date)}
                            {post.location ? ` — ${post.location}` : ""}
                        </em>
                    </p>
                </header>
                <div
                    className="blog-article-body"
                    dangerouslySetInnerHTML={{ __html: post.html }}
                />
            </article>

            {/* Image*/}
            {post.img && (
                <div className="blog-image">
                    <img
                        src={post.img}
                        alt={post.title}
                    />
                </div>
            )}
        </div>
    );
}
