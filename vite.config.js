import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [react()],
    publicDir: "public",
    base: command === "build" ? "/vord_website/" : "/",

    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true,
    },
}));
