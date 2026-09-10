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

    // Canvas fades as user scrolls past landing
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const canvasOpacity = Math.max(0, 1 - scrollY / (vh * 0.7));
    // Brand fades out faster
    const brandOpacity = Math.max(0, 1 - scrollY / (vh * 0.35));

    return (
        <div className="app">
            {/* Fixed background canvas — shows its own loading fx until
                the artwork is ready, then reveals it and calls onLoaded */}
            <Grid
                artwork={artwork}
                opacity={canvasOpacity}
                onLoaded={() => setLoaded(true)}
            />

            {/* Fixed brand — fades on scroll, visible from the very start */}
            <Brand opacity={brandOpacity} />

            {/* Everything else stays out of the page until the grid is
                ready, so the first thing shown is only the grid + brand. */}
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
                            className="section section--mission"
                        >
                            <Mission />
                        </section>

                        <section
                            id="blog"
                            className="section section--blog"
                        >
                            <Blog />
                        </section>

                        <section
                            id="about"
                            className="section section--about"
                        >
                            <About />
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
