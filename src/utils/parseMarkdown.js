export function fmtShort(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y.slice(2)}`;
}

export function fmtLong(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}.${m}.${y}`;
}

export function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    match[1].split(/\r?\n/).forEach((line) => {
        const colon = line.indexOf(":");
        if (colon === -1) return;
        const key = line.slice(0, colon).trim();
        const value = line.slice(colon + 1).trim();
        if (key) meta[key] = value;
    });

    return { meta, body: match[2] };
}

export function parseMarkdown(md) {
    return md
        .split(/\n\n+/)
        .map((block) => {
            block = block.trim();
            if (!block) return "";
            if (block.startsWith("### "))
                return `<h3>${inline(block.slice(4))}</h3>`;
            if (block.startsWith("## "))
                return `<h2>${inline(block.slice(3))}</h2>`;
            if (block.startsWith("# "))
                return `<h1>${inline(block.slice(2))}</h1>`;
            if (/^-{3,}$/.test(block)) return "<hr />";
            return `<p>${inline(block.replace(/\r?\n/g, " "))}</p>`;
        })
        .join("\n");
}

function inline(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
