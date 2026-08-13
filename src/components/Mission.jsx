import missionMd from "../content/mission.md?raw";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";
import "./Mission.css";

export default function Mission() {
    const { body } = parseFrontmatter(missionMd);
    const html = parseMarkdown(body);

    return (
        <div className="mission">
            <div
                className="mission-body"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}
