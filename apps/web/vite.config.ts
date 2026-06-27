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
  preview: { proxy: apiProxy, allowedHosts: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "pwa-icon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-192x192.png",
        "pwa-maskable-512x512.png",
        "apple-touch-icon.png"
      ],
      manifest: {
        name: "Throughline",
        short_name: "Throughline",
        id: "/app",
        description: "A calm, local-first student planner for quests, notes, boards, timelines, and progress.",
        lang: "en",
        dir: "ltr",
        theme_color: "#eef0f4",
        background_color: "#eef0f4",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
        orientation: "any",
        start_url: "/app",
        scope: "/",
        categories: ["productivity", "education"],
        launch_handler: {
          client_mode: "focus-existing"
        },
        related_applications: [
          {
            platform: "windows",
            url: "https://apps.microsoft.com/detail/9PDNH55ZKNZ7",
            id: "9PDNH55ZKNZ7"
          }
        ],
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Today",
            short_name: "Today",
            description: "Open the daily dashboard.",
            url: "/app?view=today",
            icons: [{ src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml" }]
          },
          {
            name: "Kanban",
            short_name: "Board",
            description: "Jump straight to the board.",
            url: "/app?view=kanban",
            icons: [{ src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml" }]
          },
          {
            name: "Timeline",
            short_name: "Timeline",
            description: "Open the day timeline.",
            url: "/app?view=timeline",
            icons: [{ src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml" }]
          },
          {
            name: "Notes",
            short_name: "Notes",
            description: "Open the notebook.",
            url: "/app?view=notes",
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
