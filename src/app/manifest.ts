import type { MetadataRoute } from "next";

// Web app manifest so the app can be installed on the phone's home screen
// and launch standalone (without browser chrome).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bedriftsstyring",
    short_name: "Bedrift",
    description: "Kontrakter, kunder, sikkerhet og AI-risikovurdering",
    start_url: "/",
    display: "standalone",
    background_color: "#0f141a",
    theme_color: "#1f6feb",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
