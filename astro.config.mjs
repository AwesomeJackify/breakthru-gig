// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  output: "server",
  adapter: isDev ? node({ mode: "standalone" }) : cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@mux/mux-node"],
    },
  },
  integrations: [icon()],
});
