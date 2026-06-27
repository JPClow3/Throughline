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
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
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
        display_override: ["tabbed" as unknown as "standalone", "window-controls-overlay", "standalone", "minimal-ui", "browser"],
        orientation: "any",
        start_url: "/app",
        scope: "/",
        categories: ["productivity", "education"],
        iarc_rating_id: "560677a9-2ae6-8a3a-84c0-3f535f470ce7",
        launch_handler: {
          client_mode: "focus-existing"
        },
        prefer_related_applications: false,
        related_applications: [
          {
            platform: "windows",
            url: "https://apps.microsoft.com/detail/9PDNH55ZKNZ7",
            id: "9PDNH55ZKNZ7"
          }
        ],
        file_handlers: [
          {
            action: "/app",
            accept: {
              "text/plain": [".txt", ".md"],
              "text/csv": [".csv"]
            }
          }
        ],
        protocol_handlers: [
          {
            protocol: "web+throughline",
            url: "/app?action=%s"
          }
        ],
        share_target: {
          action: "/app",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        },
        // @ts-expect-error: experimental manifest property
        widgets: [
          {
            name: "Throughline Today",
            description: "Today's timeline and tasks.",
            tag: "today",
            template: "",
            ms_ac_template: "widgets/today.json",
            data: "widgets/today-data.json",
            type: "application/json"
          }
        ],
        edge_side_panel: {
          preferred_width: 400
        },
        note_taking: {
          new_note_url: "/app?view=notes&action=new"
        },
        scope_extensions: [
          { origin: "*.throughline.app" }
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
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ]
});
