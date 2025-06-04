import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugIn = {
  name: "viktis",
  short_name: "viktis",
  display: "standalone",
  scope: "/viktis/",
  start_url: "/viktis/",
  orientation: "landscape",
  background_color: "#A3BE8C",
  theme_color: "#EBCB8B",
  icons: [
    {
      src: "/viktis/icons/viktis-icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/viktis/icons/viktis-icon-512.png",
      sizes:
        "72x72 96x96 128x128 144x144 152x152 192x192 256x256 384x384 512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

export default defineConfig({
  plugins: [react(), VitePWA(manifestForPlugIn)],
  base: "/viktis/",
});

// Orange dots: #D87F32

// Line: #EBCB8B (soft yellow)

// Background: #A3BE8C (muted green)
