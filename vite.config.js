import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: parseInt(process.env.PORT || "5173"),
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ["gsap"],
          three: ["three"],
        },
      },
    },
  },
});
