import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 950
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "pwa-icon.svg"],
      manifest: {
        name: "Throughline",
        short_name: "Throughline",
        description: "A calm, local-first planner where goals hold the work — with notes, a board, and a timeline.",
        theme_color: "#eef0f4",
        background_color: "#eef0f4",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["productivity"],
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ],
        shortcuts: [
          {
            name: "Kanban",
            short_name: "Kanban",
            url: "/?view=kanban",
            icons: [{ src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml" }]
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html"
      },
      devOptions: {
        enabled: true
      }
    })
  ]
});
