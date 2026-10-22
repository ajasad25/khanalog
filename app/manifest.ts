import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Khana Log",
    short_name: "Khana Log",
    description: "A calorie tracker you just talk to.",
    start_url: "/",
    display: "standalone",
    background_color: "#efefe9",
    theme_color: "#223030",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
