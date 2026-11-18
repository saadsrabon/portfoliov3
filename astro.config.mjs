import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://saadsrabon.com",
  output: "server",
  adapter: vercel(),
  integrations: [sitemap({
    filter: (page) => !page.includes("/blog/payments-that-can-be-retried") && !page.includes("/blog/email-imports-that-recover"),
  })],
});
