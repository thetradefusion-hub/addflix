import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-vendor|decimal\.js-light|lodash|es-toolkit|immer|redux|@reduxjs|reselect|react-redux|eventemitter3|tiny-invariant)/.test(id)) return "charts";
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return "icons";
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|clsx|tailwind-merge|class-variance-authority)[\\/]/.test(id)) return "react";
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});

