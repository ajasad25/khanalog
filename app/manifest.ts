import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Khana Log",
    short_name: "Khana Log",
    description: "A calorie-tracking assistant you just talk to.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f0e6",
    theme_color: "#5c2a0b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
