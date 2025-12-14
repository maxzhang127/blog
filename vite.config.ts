import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const srcRoot = path.join(repoRoot, "src");

export default defineConfig({
  root: srcRoot,
  plugins: [react()],
  publicDir: path.join(repoRoot, "public"),
  build: {
    outDir: path.join(repoRoot, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: path.join(srcRoot, "index.html"),
        posts: path.join(srcRoot, "posts/index.html"),
        post: path.join(srcRoot, "post/index.html"),
      },
    },
  },
});
