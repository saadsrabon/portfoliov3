import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auditEvents, posts } from "../../../../db/schema";
import { postInputSchema } from "../../../../lib/cms";
import { getDatabase } from "../../../../lib/database";
import { adminSession, sameOriginJson, verifyCsrf } from "../../../../lib/security";

export const PATCH: APIRoute = async ({ request, params }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  if (Number(request.headers.get("content-length") ?? 0) > 55_000) return Response.json({ error: "Request too large." }, { status: 413 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Post validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const db = await getDatabase();
  const [before] = await db.select().from(posts).where(eq(posts.id, params.id!)).limit(1);
  if (!before) return Response.json({ error: "Post not found." }, { status: 404 });
  const value = parsed.data;
  const publishedAt = value.status === "draft" ? null : before.publishedAt ?? new Date();
  try {
    const [post] = await db.update(posts).set({
      slug: value.slug, title: value.title, description: value.description, bodyMarkdown: value.bodyMarkdown,
      status: value.status, tags: value.tags, readTime: value.readTime || null,
      coverImage: value.coverImage || null, coverImageAlt: value.coverImageAlt || null,
      seoTitle: value.seoTitle || null, seoDescription: value.seoDescription || null,
      canonicalUrl: value.canonicalUrl || null, socialImage: value.socialImage || null,
      publishedAt, updatedAt: new Date(),
    }).where(eq(posts.id, params.id!)).returning();
    const action = before.status !== post.status ? `post.${post.status}` : "post.updated";
    await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action, entityType: "post", entityId: post.id, metadata: { slug: post.slug, status: post.status } });
    return Response.json({ post }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return Response.json({ error: "That post slug is already in use." }, { status: 409 });
    return Response.json({ error: "Post could not be updated." }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  const db = await getDatabase();
  const [post] = await db.select({ id: posts.id, slug: posts.slug, status: posts.status }).from(posts).where(eq(posts.id, params.id!)).limit(1);
  if (!post) return Response.json({ error: "Post not found." }, { status: 404 });
  if (post.status !== "draft") return Response.json({ error: "Unpublish this post before deleting it." }, { status: 409 });
  await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action: "post.deleted", entityType: "post", entityId: post.id, metadata: { slug: post.slug, status: post.status } });
  await db.delete(posts).where(eq(posts.id, post.id));
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
};
