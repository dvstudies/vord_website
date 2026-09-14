import missionMd from "../content/mission.md?raw";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import "./Mission.css";

export default function Mission() {
    const { meta, body } = parseFrontmatter(missionMd);
    const html = parseMarkdown(body);

    return (
        <div>
            <div className="header">
                <h1>{meta.title}</h1>
            </div>
            <div
                className="content-body w"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}
