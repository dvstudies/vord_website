import "./Brand.css";

export default function Brand({ opacity = 1 }) {
    return (
        <>
            {/* Top-left attribution */}
            <div
                className="brand-attribution"
                style={{
                    opacity,
                    width: "200px",
                    height: "100px",
                }}
            >
                <img
                    src="dvs-svg-uz.png"
                    style={{
                        width: "100%",
                        heigth: "auto",
                    }}
                ></img>
            </div>

            {/* Centred wordmark */}
            <header
                className="brand"
                style={{ opacity }}
                aria-label="VORD"
            >
                <h1>VORD</h1>
                <p>Visual Open Research Data</p>
            </header>
        </>
    );
}
