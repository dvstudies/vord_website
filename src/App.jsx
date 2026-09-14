import { useState, useEffect } from "react";
import Landing from "./components/Landing.jsx";
import Nav from "./components/Nav.jsx";
import Mission from "./components/Mission.jsx";
import Blog from "./components/Blog.jsx";
import About from "./components/About.jsx";
import { getDailyArtwork } from "./data/fallbackArtworks.js";
import "./styles/global.css";

const SECTIONS = ["landing", "mission", "blog", "about"];

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
                setLoaded(true);
            }
        }
        fetchArtwork();

        const fallback = setTimeout(() => setLoaded(true), MAX_LOAD_WAIT_MS);

        function onScroll() {
            const y = window.scrollY;
            setScrollY(y);

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

    return (
        <div className="app">
            {loaded && (
                <Nav
                    activeSection={activeSection}
                    onNavigate={scrollToSection}
                />
            )}

            <div className="sections">
                <section
                    id="landing"
                    className="section section--landing"
                >
                    <Landing
                        artwork={artwork}
                        scrollY={scrollY}
                        setLoaded={setLoaded}
                    />
                </section>

                {loaded && (
                    <>
                        <section
                            id="mission"
                            className="section section--sticky section--w"
                        >
                            <Mission />
                        </section>

                        <section
                            id="blog"
                            className="section section--carousel section--b"
                        >
                            <Blog />
                        </section>

                        <section
                            id="about"
                            className="section section--sticky section--b"
                        >
                            <About />
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
