// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@mux/mux-node"],
    },
  },
  integrations: [icon()],
});
