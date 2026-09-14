import { parseFrontmatter, parseMarkdown, parseJSONLoose } from "./parseMarkdown.js";

const blogModules = import.meta.glob("../content/blog/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

const blogImages = import.meta.glob("../content/blog/imgs/*", {
    eager: true,
    import: "default",
});

const newsModules = import.meta.glob("../content/news.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

function resolveImage(filename) {
    if (!filename) return null;
    const match = Object.entries(blogImages).find(([path]) =>
        path.endsWith(`/${filename}`),
    );
    return match ? match[1] : null;
}

function parseParticipants(raw) {
    if (!raw) return [];
    try {
        return parseJSONLoose(raw);
    } catch (err) {
        console.warn("Could not parse `participants` frontmatter:", err, raw);
        return [];
    }
}

export function loadPosts() {
    return Object.entries(blogModules)
        .map(([, raw]) => {
            const { meta, body } = parseFrontmatter(raw);
            return {
                date: meta.date || "",
                title: meta.title || "Untitled",
                location: meta.location || "",
                img: resolveImage(meta.img),
                participants: parseParticipants(meta.participants),
                html: parseMarkdown(body),
            };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
}

export function loadNews() {}
