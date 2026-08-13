import "./Nav.css";

const SECTIONS = ["mission", "blog", "about"];

export default function Nav({ activeSection, onNavigate }) {
    return (
        <nav className="main-nav" aria-label="Main navigation">
            {SECTIONS.map((id) => (
                <button
                    key={id}
                    className={`nav-btn${activeSection === id ? " nav-btn--active" : ""}`}
                    onClick={() => onNavigate(id)}
                    aria-current={activeSection === id ? "page" : undefined}
                >
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
            ))}
        </nav>
    );
}
