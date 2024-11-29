import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Läss",
    short_name: "Läss",
    description: "A platform for learning Svenska",
    start_url: "/",
    display: "standalone",
    background_color: "#e5e7eb",
    theme_color: "#e5e7eb",
    orientation: "any",
    icons: [
      {
        src: "apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "favicon.ico",
        sizes: "16x16 32x32 48x48 64x64 128x128 256x256",
      },
    ],
  };
}
