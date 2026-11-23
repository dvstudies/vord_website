import workshopMd from "../content/workshop.md?raw";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import { useSlideEntered } from "../hooks/SlideEnteredContext.jsx";
import { useLatchedTrue } from "../hooks/useLatchedTrue.js";
import SlidingY from "./SlidingY.jsx";

import "./Mission.css";

export default function Workshop() {
    const { meta, body } = parseFrontmatter(workshopMd);
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
            <SlidingY open={entered}>
                <div
                    className="content-body w"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </SlidingY>
        </div>
    );
}
