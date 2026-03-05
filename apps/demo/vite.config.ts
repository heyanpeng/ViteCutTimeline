import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@vitecut/timeline": fileURLToPath(
        new URL("../../packages/timeline/src/index.ts", import.meta.url)
      )
    }
  }
});
