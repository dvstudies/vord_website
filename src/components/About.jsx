import aboutMd from "../content/about.md?raw";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import "./About.css";

export default function About() {
    const { body } = parseFrontmatter(aboutMd);
    const html = parseMarkdown(body);

    return (
        <div className="about">
            <div
                className="about-body"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}
