import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When running inside Docker the container sets VITE_PROXY_TARGET=http://nginx:80.
// When running locally (npm run dev) we fall back to the nginx gateway exposed on
// localhost:8081 (see my-dashboard-docker/docker-compose.yml ports section).
const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8081";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    coverage: {
      reporter: ["text", "lcov"],
    },
  },
});
