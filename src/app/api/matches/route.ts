import { getDb } from "@/lib/db";
import { getMatches } from "@/lib/discover";
import { handleError, json } from "@/lib/http";
import { CURRENT_USER_ID } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const matches = await getMatches(db, CURRENT_USER_ID);
    return json({ matches });
  } catch (err) {
    return handleError(err);
  }
}
