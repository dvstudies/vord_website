import { useState } from "react";

/**
 * Once `value` becomes truthy, this stays `true` forever after,
 * regardless of what `value` does next — a one-way latch, not a
 * mirror. Used for things that should only ever reveal once (e.g. a
 * slide title's .sliding-x), as opposed to reactively opening and
 * closing every time the trigger flips (see SlidingY, which reads
 * the raw boolean directly instead).
 *
 * Sets state during render (guarded so it can't loop) rather than in
 * a useEffect, so there's no extra commit where the stale `false`
 * value would briefly reach the DOM before catching up.
 */
export function useLatchedTrue(value) {
    const [latched, setLatched] = useState(false);
    if (value && !latched) {
        setLatched(true);
    }
    return latched;
}
