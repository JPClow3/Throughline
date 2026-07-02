import { describe, expect, it } from "vitest";
import { appManifest, pwaIncludeAssets } from "../../vite.config";

describe("PWA Microsoft Store configuration", () => {
  it("keeps a stable Windows Store manifest identity", () => {
    expect(appManifest.id).toBe("/app");
    expect(appManifest.start_url).toBe("/app");
    expect(appManifest.scope).toBe("/");
    expect(appManifest.display).toBe("standalone");
    expect(appManifest.related_applications).toContainEqual({
      platform: "windows",
      url: "https://apps.microsoft.com/detail/9PDNH55ZKNZ7",
      id: "9PDNH55ZKNZ7"
    });
  });

  it("publishes Store-grade screenshots and icon metadata", () => {
    expect(appManifest.screenshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/screenshot-1.png",
          sizes: "1366x768",
          form_factor: "wide"
        }),
        expect.objectContaining({
          src: "/screenshot-2.png",
          sizes: "720x1280",
          form_factor: "narrow"
        })
      ])
    );

    expect(appManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/store-assets/microsoft-store/manifest-icon-192.maskable.png",
          sizes: "192x192",
          purpose: "maskable"
        }),
        expect.objectContaining({
          src: "/store-assets/microsoft-store/manifest-icon-512.maskable.png",
          sizes: "512x512",
          purpose: "maskable"
        })
      ])
    );
  });

  it("pre-caches the Windows Store tile asset set", () => {
    expect(pwaIncludeAssets).toEqual(
      expect.arrayContaining([
        "store-assets/windows-icons/StoreLogo.png",
        "store-assets/windows-icons/Square44x44Logo.png",
        "store-assets/windows-icons/Square150x150Logo.png",
        "store-assets/windows-icons/Square310x310Logo.png",
        "store-assets/windows-icons/Wide310x150Logo.png"
      ])
    );
  });
});
