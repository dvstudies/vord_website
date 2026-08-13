import { useState, useEffect } from "react";
import Grid from "./components/Grid.jsx";
import Brand from "./components/Brand.jsx";
import Nav from "./components/Nav.jsx";
import Mission from "./components/Mission.jsx";
import Blog from "./components/Blog.jsx";
import About from "./components/About.jsx";
import { getDailyArtwork } from "./data/fallbackArtworks.js";
import "./styles/global.css";

const SECTIONS = ["landing", "mission", "blog", "about"];

export default function App() {
    const artwork = getDailyArtwork();
    const [activeSection, setActiveSection] = useState("landing");
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
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
        return () => window.removeEventListener("scroll", onScroll);
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
            {/* Fixed background canvas */}
            <Grid artwork={artwork} opacity={canvasOpacity} />

            {/* Fixed brand — fades on scroll */}
            <Brand opacity={brandOpacity} />

            {/* Fixed nav — always on top */}
            <Nav activeSection={activeSection} onNavigate={scrollToSection} />

            {/* Scrollable sections */}
            <div className="sections">
                <section id="landing" className="section section--landing" />

                <section id="mission" className="section section--mission">
                    <Mission />
                </section>

                <section id="blog" className="section section--blog">
                    <Blog />
                </section>

                <section id="about" className="section section--about">
                    <About />
                </section>
            </div>
        </div>
    );
}
