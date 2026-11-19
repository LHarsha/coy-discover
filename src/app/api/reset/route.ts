import { getDb, resetDemo } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Restores the seeded demo data. Disabled in production unless ALLOW_DEMO_RESET=true. */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true") {
    return json({ error: { code: "not_found", message: "Not found" } }, 404);
  }
  await resetDemo(await getDb());
  return json({ ok: true });
}
