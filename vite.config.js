import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Inside Docker: VITE_PROXY_TARGET=http://nginx:80
// Outside Docker (npm run dev): falls back to http://localhost (nginx on port 80)
const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: process.env.DOCKER ? "0.0.0.0" : "127.0.0.1",
    allowedHosts: ["localhost", "127.0.0.1", ".mydashboard.local", "nginx"],
    proxy: {
      "/auth": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/dashboard": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/events": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/notification": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/translation": {
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
