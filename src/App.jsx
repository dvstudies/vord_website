import { useState, useEffect } from "react";
import Grid from "./components/Grid/Grid.jsx";
import Brand from "./components/Brand.jsx";
import Nav from "./components/Nav.jsx";
import Mission from "./components/Mission.jsx";
import Blog from "./components/Blog.jsx";
import About from "./components/About.jsx";
import { getDailyArtwork } from "./data/fallbackArtworks.js";
import "./styles/global.css";

const SECTIONS = ["landing", "mission", "blog", "about"];

// Safety net: if the artwork fetch or image pipeline never resolves (e.g.
// no network), reveal the rest of the site anyway after this long, so the
// grid's loading state can never get stuck forever.
const MAX_LOAD_WAIT_MS = 8000;

export default function App() {
    const [artwork, setArtworkData] = useState(null);
    const [activeSection, setActiveSection] = useState("landing");
    const [scrollY, setScrollY] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function fetchArtwork() {
            try {
                const data = await getDailyArtwork();
                setArtworkData(data);
            } catch (error) {
                console.error("Error fetching daily artwork:", error);
                setLoaded(true); // nothing left to wait on
            }
        }
        fetchArtwork();

        // Grid's onLoaded below is what normally reveals the rest of the
        // site; this is only a fallback in case that never fires.
        const fallback = setTimeout(() => setLoaded(true), MAX_LOAD_WAIT_MS);

        function onScroll() {
            const y = window.scrollY;
            setScrollY(y);

            // Determine active section (scan from bottom so last match wins)
            const threshold = window.innerHeight * 0.45;
            let active = "landing";
            for (const id of SECTIONS) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= threshold) {
                    active = id;
                }
            }
            setActiveSection(active);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            clearTimeout(fallback);
        };
    }, []);

    function scrollToSection(id) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }

    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const canvasOpacity = Math.max(0.2, 1 - scrollY / (vh * 0.7));
    const brandOpacity = Math.max(0.2, 1 - scrollY / (vh * 0.35));

    return (
        <div className="app">
            <Grid
                artwork={artwork}
                opacity={canvasOpacity}
                onLoaded={() => setLoaded(true)}
            />

            <Brand opacity={brandOpacity} />

            {loaded && (
                <>
                    <Nav
                        activeSection={activeSection}
                        onNavigate={scrollToSection}
                    />

                    <div className="sections">
                        <section
                            id="landing"
                            className="section section--landing"
                        />

                        <section
                            id="mission"
                            className="section section--sticky section--w"
                        >
                            <Mission />
                        </section>

                        <section
                            id="blog"
                            className="section section--sticky section--b"
                        >
                            <Blog />
                        </section>

                        <section
                            id="about"
                            className="section section--sticky section--b"
                        >
                            <About />
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
