import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["localhost", "127.0.0.1", "cleora-noncongratulatory-effortfully.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: 'http://backend_app:8000',
        changeOrigin: false,
      },
      '/sanctum': {
        target: 'http://backend_app:8000',
        changeOrigin: false,
      },
      '/login': {
        target: 'http://backend_app:8000',
        changeOrigin: false,
      },
      '/logout': {
        target: 'http://backend_app:8000',
        changeOrigin: false,
      },
    },
    watch: mode === "development" ? { usePolling: true } : undefined,
  },
  define: {
    global: "globalThis",
  },
}));
