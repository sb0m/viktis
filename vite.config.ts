import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "viktis",
        short_name: "viktis",
        start_url: ".",
        display: "standalone",
        background_color: "#A3BE8C",
        theme_color: "#EBCB8B",
        icons: [
          {
            src: "viktis-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "viktis-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  base: process.env.NODE_ENV === "production" ? "/my-pwa-app/" : "/",
});

// Orange dots: #D87F32

// Line: #EBCB8B (soft yellow)

// Background: #A3BE8C (muted green)
