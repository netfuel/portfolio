import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: parseInt(process.env.PORT || "5173"),
    strictPort: false,
  },
  build: {
    // The design already requires a modern browser (WebGL, dvh, :has()) —
    // shipping es2022 keeps async/await and class fields untranspiled
    target: "es2022",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        portfolio: resolve(__dirname, "portfolio.html"),
        cv: resolve(__dirname, "cv.html"),
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
