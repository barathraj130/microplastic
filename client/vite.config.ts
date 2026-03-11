import basicSsl from "@vitejs/plugin-basic-ssl"
import react from "@vitejs/plugin-react"
import autoprefixer from "autoprefixer"
import { fileURLToPath, URL } from "node:url"
import tailwindcss from "tailwindcss"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), basicSsl()],

  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "lucide-react", "framer-motion", "axios"],
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    host: "0.0.0.0",     // ✅ ALLOW NETWORK ACCESS
    port: 5173,          // ✅ FIXED PORT
    strictPort: true,    // ✅ fail if port is taken

    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
})
