import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Build into ../web/dist so Flask can serve the built assets from web/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname),
    build: {
        outDir: path.resolve(__dirname, "./dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, "index.html"),
        },
    },
});
