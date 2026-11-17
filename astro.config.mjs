import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://saadsrabon.com",
  output: "static",
  integrations: [sitemap({
    filter: (page) => !page.includes("/blog/payments-that-can-be-retried") && !page.includes("/blog/email-imports-that-recover"),
  })],
});
