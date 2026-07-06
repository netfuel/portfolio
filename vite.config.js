import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: parseInt(process.env.PORT || "5173"),
    strictPort: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        portfolio: resolve(__dirname, "portfolio.html"),
      },
      output: {
        manualChunks: {
          gsap: ["gsap"],
          three: ["three"],
        },
      },
    },
  },
});
