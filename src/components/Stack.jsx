import { forwardRef, useImperativeHandle } from "react";
import { useStackScroll } from "../hooks/useStackScroll.js";
import "./Stack.css";

const Stack = forwardRef(function Stack({ slides, onActiveChange }, ref) {
    const { stageRef, slideRefs, scrollToId } = useStackScroll(slides, {
        onActiveChange,
    });

    useImperativeHandle(ref, () => ({ scrollToId }), [scrollToId]);

    if (slides.length === 0) return null;

    return (
        <div
            className="stack"
            ref={stageRef}
            style={{ height: `${slides.length * 100}dvh` }}
        >
            <div className="stack-viewport">
                {slides.map((slide, i) => (
                    <div
                        key={slide.id}
                        id={slide.id}
                        className={`stack-slide section--${slide.theme}`}
                        ref={(el) => (slideRefs.current[i] = el)}
                        style={{ zIndex: i + 1 }}
                    >
                        {slide.render()}
                    </div>
                ))}
            </div>
        </div>
    );
});

export default Stack;
