import { useEffect, useMemo, useRef, useState } from "react";
import Landing from "./components/Landing.jsx";
import Nav from "./components/Nav.jsx";
import Mission from "./components/Mission.jsx";
import Blog from "./components/Blog.jsx";
import About from "./components/About.jsx";
import Stack from "./components/Stack.jsx";
import { getDailyArtwork } from "./data/fallbackArtworks.js";
import { loadPosts } from "./utils/fetchFiles.jsx";
import "./styles/global.css";

const MAX_LOAD_WAIT_MS = 48000;

export default function App() {
    const [artwork, setArtworkData] = useState(null);
    const [activeSection, setActiveSection] = useState("landing");
    const [scrollY, setScrollY] = useState(0);
    const [loaded, setLoaded] = useState(false);

    const posts = useMemo(loadPosts, []);
    const stackRef = useRef(null);

    const slides = useMemo(() => {
        const blogSlides = posts.map((post, i) => ({
            id: i === 0 ? "blog" : `blog-${i}`,
            navId: "blog",
            axis: i === 0 ? "vertical" : "horizontal",
            theme: "b",
            render: () => <Blog post={post} />,
        }));

        return [
            {
                id: "mission",
                navId: "mission",
                axis: "vertical",
                theme: "w",
                render: () => <Mission />,
            },
            ...blogSlides,
            {
                id: "about",
                navId: "about",
                axis: "vertical",
                theme: "b",
                render: () => <About />,
            },
        ];
    }, [posts]);

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
            setScrollY(window.scrollY);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            clearTimeout(fallback);
        };
    }, []);

    function scrollToSection(id) {
        stackRef.current?.scrollToId(id);
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
                    <Stack
                        ref={stackRef}
                        slides={slides}
                        onActiveChange={(navId) =>
                            setActiveSection(navId ?? "landing")
                        }
                    />
                )}
            </div>
        </div>
    );
}
