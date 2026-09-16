import aboutMd from "../content/about.md?raw";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import { useSlideEntered } from "../hooks/SlideEnteredContext.jsx";
import { useLatchedTrue } from "../hooks/useLatchedTrue.js";
import SlidingY from "./SlidingY.jsx";
import "./About.css";

export default function About() {
    const { meta, body } = parseFrontmatter(aboutMd);
    const html = parseMarkdown(body);
    const entered = useSlideEntered();
    const isOpen = useLatchedTrue(entered);

    return (
        <div>
            <div className={`header`}>
                <div className={`sliding-x${isOpen ? " is-visible" : ""}`}>
                    <h1>{meta.title}</h1>
                </div>
            </div>
            <SlidingY open={true}>
                <div
                    className="content-body full-w b"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </SlidingY>
        </div>
    );
}
