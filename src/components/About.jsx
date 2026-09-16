import aboutMd from "../content/about.md?raw";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import "./About.css";

export default function About() {
    const { meta, body } = parseFrontmatter(aboutMd);
    const html = parseMarkdown(body);

    return (
        <div>
            <div className="header">
                <h1>{meta.title}</h1>
            </div>
            <div
                className="content-body full-w b"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}
