import { createContext, useContext } from "react";

const SlideEnteredContext = createContext(false);

export function SlideEnteredProvider({ value, children }) {
    return (
        <SlideEnteredContext.Provider value={value}>
            {children}
        </SlideEnteredContext.Provider>
    );
}

export function useSlideEntered() {
    return useContext(SlideEnteredContext);
}
