import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auditEvents, resources } from "../../../../db/schema";
import { resourceInputSchema } from "../../../../lib/cms";
import { getDatabase } from "../../../../lib/database";
import { adminSession, sameOriginJson, verifyCsrf } from "../../../../lib/security";

export const PATCH: APIRoute = async ({ request, params }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = resourceInputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Resource validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const value = parsed.data;
  const db = await getDatabase();
  const [before] = await db.select({ status: resources.status }).from(resources).where(eq(resources.id, params.id!)).limit(1);
  if (!before) return Response.json({ error: "Resource not found." }, { status: 404 });
  try {
    const [resource] = await db.update(resources).set({
      slug: value.slug, title: value.title, description: value.description, author: value.author || null,
      category: value.category, url: value.url, coverImage: value.coverImage || null,
      coverImageAlt: value.coverImageAlt || null, status: value.status, seoTitle: value.seoTitle || null,
      seoDescription: value.seoDescription || null, updatedAt: new Date(),
    }).where(eq(resources.id, params.id!)).returning();
    const action = before.status !== resource.status ? `resource.${resource.status}` : "resource.updated";
    await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action, entityType: "resource", entityId: resource.id, metadata: { slug: resource.slug, status: resource.status } });
    return Response.json({ resource }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return Response.json({ error: "That resource slug is already in use." }, { status: 409 });
    return Response.json({ error: "Resource could not be updated." }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  const db = await getDatabase();
  const [resource] = await db.select({ id: resources.id, slug: resources.slug, status: resources.status }).from(resources).where(eq(resources.id, params.id!)).limit(1);
  if (!resource) return Response.json({ error: "Resource not found." }, { status: 404 });
  if (resource.status !== "draft") return Response.json({ error: "Unpublish this resource before deleting it." }, { status: 409 });
  await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action: "resource.deleted", entityType: "resource", entityId: resource.id, metadata: { slug: resource.slug, status: resource.status } });
  await db.delete(resources).where(eq(resources.id, resource.id));
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
};
