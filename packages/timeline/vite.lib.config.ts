import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  copyPublicDir: false,
  build: {
    outDir: "dist-lib",
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "ViteCutTimeline",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs")
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ["react", "react-dom"]
    }
  }
});
