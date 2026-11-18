import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auditEvents, posts } from "../../../../db/schema";
import { postInputSchema } from "../../../../lib/cms";
import { getDatabase } from "../../../../lib/database";
import { adminSession, sameOriginJson, verifyCsrf } from "../../../../lib/security";

export const GET: APIRoute = async ({ request }) => {
  const access = await adminSession(request);
  if (access.response) return access.response;
  try {
    const db = await getDatabase();
    const rows = await db.select().from(posts).orderBy(desc(posts.updatedAt)).limit(100);
    return Response.json({ posts: rows }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "Content store unavailable." }, { status: 503 }); }
};

export const POST: APIRoute = async ({ request }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  if (Number(request.headers.get("content-length") ?? 0) > 55_000) return Response.json({ error: "Request too large." }, { status: 413 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Post validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const value = parsed.data;
  const id = randomUUID();
  const publishedAt = value.status === "published" ? new Date() : null;
  const db = await getDatabase();
  try {
    const [post] = await db.insert(posts).values({
      id, slug: value.slug, title: value.title, description: value.description, bodyMarkdown: value.bodyMarkdown,
      status: value.status, tags: value.tags, readTime: value.readTime || null,
      coverImage: value.coverImage || null, coverImageAlt: value.coverImageAlt || null,
      seoTitle: value.seoTitle || null, seoDescription: value.seoDescription || null,
      canonicalUrl: value.canonicalUrl || null, socialImage: value.socialImage || null,
      publishedAt, authorId: access.session.user.id,
    }).returning();
    await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action: value.status === "published" ? "post.created.published" : "post.created.draft", entityType: "post", entityId: id, metadata: { slug: post.slug, status: post.status } });
    return Response.json({ post }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return Response.json({ error: "That post slug is already in use." }, { status: 409 });
    return Response.json({ error: "Post could not be saved." }, { status: 500 });
  }
};
