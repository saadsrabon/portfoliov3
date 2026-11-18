import type { APIRoute } from "astro";
import { asc, eq } from "drizzle-orm";
import { posts } from "../db/schema";
import { getDatabase } from "../lib/database";
import { caseStudies, conceptProjects } from "../data/site";

const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export const GET: APIRoute = async () => {
  const db = await getDatabase();
  const publishedPosts = await db.select({ slug: posts.slug, updatedAt: posts.updatedAt }).from(posts).where(eq(posts.status, "published")).orderBy(asc(posts.slug));
  const fixed = ["", "journey/", "work/", "contact/", "book/", "blog/", "library/", "media/", ...caseStudies.map((item) => `work/${item.slug}/`), ...conceptProjects.map((item) => `work/${item.slug}/`)];
  const urls = [
    ...fixed.map((path) => ({ path, updated: undefined as Date | undefined })),
    ...publishedPosts.map((post) => ({ path: `blog/${post.slug}/`, updated: post.updatedAt })),
  ];
  const body = urls.map(({ path, updated }) => `<url><loc>${xml(`https://saadsrabon.com/${path}`)}</loc>${updated ? `<lastmod>${updated.toISOString()}</lastmod>` : ""}</url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300" } });
};
