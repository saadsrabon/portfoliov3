import type { APIRoute } from "astro";
import { getAuth } from "../../../lib/auth";

export const ALL: APIRoute = async ({ request, clientAddress }) => {
  try {
    const headers = new Headers(request.headers);
    // Replace the client-supplied value. Better Auth only receives the runtime's trusted address.
    if (clientAddress) headers.set("x-forwarded-for", clientAddress);
    return await (await getAuth()).handler(new Request(request, { headers }));
  } catch (error) {
    console.error("Authentication handler failed.", error);
    return Response.json({ error: "Authentication is unavailable until the database is configured and migrated." }, { status: 503 });
  }
};
