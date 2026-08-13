import { useState, useMemo } from "react";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import "./Blog.css";

// Load all blog posts eagerly
const blogModules = import.meta.glob(
    "../content/blog/*.md",
    { query: "?raw", import: "default", eager: true }
);

function loadPosts() {
    return Object.entries(blogModules)
        .map(([, raw]) => {
            const { meta, body } = parseFrontmatter(raw);
            return {
                date: meta.date || "",
                title: meta.title || "Untitled",
                location: meta.location || "",
                html: parseMarkdown(body),
            };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
}

/** DD/MM/YY for sidebar */
function fmtShort(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(2)}`;
}

/** DD.MM.YYYY for article header */
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
        </div>
    );
}
