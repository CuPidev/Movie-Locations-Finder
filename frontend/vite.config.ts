import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

// Build into ../web/dist so Flask can serve the built assets from web/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    build: {
        outDir: path.resolve(__dirname, "./dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, "index.html"),
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
        },
    },
});
