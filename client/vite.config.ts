import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    host: "127.0.0.1",   // ✅ FORCE IPv4
    port: 5173,          // ✅ FIXED PORT
    strictPort: true,    // ✅ fail if port is taken

    proxy: {
      "/upload": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/live": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/result": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
})
