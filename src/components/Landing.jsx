import { useState, useEffect } from "react";
import Grid from "./Grid/Grid.jsx";
import Brand from "./Brand.jsx";
import { parseFrontmatter, parseMarkdown } from "../utils/parseMarkdown.js";

import "./Landing.css";

const newsModules = import.meta.glob("../content/news.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

export default function Landing({ artwork, scrollY, setLoaded }) {
    const [enabled, setEnabled] = useState(true);
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const canvasOpacity = Math.max(0.2, 1 - scrollY / (vh * 0.7));
    const brandOpacity = Math.max(0.2, 1 - scrollY / (vh * 0.35));

    useEffect(() => {
        setEnabled(Math.max(0, 1 - scrollY / vh) > 0);
    }, [scrollY, vh]);

    return (
        <>
            <Grid
                artwork={artwork}
                opacity={1}
                enabled={enabled}
                onLoaded={() => setLoaded(true)}
            />
            <Brand opacity={1} />
            {artwork && <Credits artwork={artwork} />}
            <News />
        </>
    );
}

function Credits({ artwork }) {
    return (
        <div id="credits">
            <div className="cell">
                <p className="t-code">
                    {artwork?.meta?.title}
                    <br /> CREDITS: {artwork?.meta?.artist}, Wikipedia
                </p>
            </div>
        </div>
    );
}

function News({}) {
    const [open, setOpen] = useState(false);
    return (
        <div id="news">
            <div
                className="cell clickable b"
                onClick={() => setOpen(!open)}
            >
                <h2>News // News // News</h2>
            </div>
            {open && (
                <div className="cell scrollable">
                    <p>
                        We are looking for historians and collaborators to join
                        our second workshop! Stay tuned for more updates and
                        events related to our project. We are looking for
                        historians and collaborators to join our second
                        workshop! Stay tuned for more updates and events related
                        to our project. We are looking for historians and
                        collaborators to join our second workshop! Stay tuned
                        for more updates and events related to our project. We
                        are looking for historians and collaborators to join our
                        second workshop! Stay tuned for more updates and events
                        related to our project. We are looking for historians
                        and collaborators to join our second workshop! Stay
                        tuned for more updates and events related to our
                        project. We are looking for historians and collaborators
                        to join our second workshop! Stay tuned for more updates
                        and events related to our project.
                    </p>
                </div>
            )}
        </div>
    );
}
