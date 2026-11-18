import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auditEvents, resources } from "../../../../db/schema";
import { resourceInputSchema } from "../../../../lib/cms";
import { getDatabase } from "../../../../lib/database";
import { adminSession, sameOriginJson, verifyCsrf } from "../../../../lib/security";

export const GET: APIRoute = async ({ request }) => {
  const access = await adminSession(request);
  if (access.response) return access.response;
  const db = await getDatabase();
  const rows = await db.select().from(resources).orderBy(desc(resources.updatedAt)).limit(100);
  return Response.json({ resources: rows }, { headers: { "Cache-Control": "private, no-store" } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = resourceInputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Resource validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const value = parsed.data;
  const id = randomUUID();
  const db = await getDatabase();
  try {
    const [resource] = await db.insert(resources).values({
      id, slug: value.slug, title: value.title, description: value.description, author: value.author || null,
      category: value.category, url: value.url, coverImage: value.coverImage || null,
      coverImageAlt: value.coverImageAlt || null, status: value.status, seoTitle: value.seoTitle || null,
      seoDescription: value.seoDescription || null, authorId: access.session.user.id,
    }).returning();
    await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action: value.status === "published" ? "resource.created.published" : "resource.created.draft", entityType: "resource", entityId: id, metadata: { slug: resource.slug, status: resource.status } });
    return Response.json({ resource }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return Response.json({ error: "That resource slug is already in use." }, { status: 409 });
    return Response.json({ error: "Resource could not be saved." }, { status: 500 });
  }
};
