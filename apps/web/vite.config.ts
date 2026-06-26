import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Local full-stack dev: proxy /api → the push/auth/sync API, stripping the
// prefix to mirror Traefik's StripPrefix in production (same-origin cookies).
const apiProxy = {
  "/api": {
    target: process.env.VITE_DEV_API_TARGET ?? "http://127.0.0.1:8787",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, "")
  }
};

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 950
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "pwa-icon.svg", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Throughline",
        short_name: "Throughline",
        description: "A calm, local-first planner where goals hold the work — with notes, a board, and a timeline.",
        theme_color: "#eef0f4",
        background_color: "#eef0f4",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/app",
        scope: "/",
        categories: ["productivity"],
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        shortcuts: [
          {
            name: "Kanban",
            short_name: "Kanban",
            url: "/app?view=kanban",
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
