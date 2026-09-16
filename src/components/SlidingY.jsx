import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function SlidingY({ open, className = "", children, ...rest }) {
    const ref = useRef(null);
    const [settled, setSettled] = useState(false);

    useLayoutEffect(() => {
        if (!open) setSettled(false);
    }, [open]);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        function onTransitionEnd(e) {
            if (e.target !== node) return;
            if (e.propertyName !== "grid-template-rows") return;
            setSettled(open);
        }

        node.addEventListener("transitionend", onTransitionEnd);
        return () => node.removeEventListener("transitionend", onTransitionEnd);
    }, [open]);

    return (
        <div
            ref={ref}
            className={`sliding-y${open ? " is-open" : ""}${settled ? " is-settled" : ""}${className ? ` ${className}` : ""}`}
            {...rest}
        >
            {children}
        </div>
    );
}
