import { getDb } from "@/lib/db";
import { DiscoverError, parseSwipeInput, recordSwipe } from "@/lib/discover";
import { handleError, json } from "@/lib/http";
import { CURRENT_USER_ID } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new DiscoverError("invalid_request", "Body must be valid JSON", 400);
    }
    const { profileId, action } = parseSwipeInput(body);
    const db = await getDb();
    const result = await recordSwipe(db, CURRENT_USER_ID, profileId, action);
    return json(result, 201);
  } catch (err) {
    return handleError(err);
  }
}
