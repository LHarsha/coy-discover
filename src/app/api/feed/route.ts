import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getFeed } from "@/lib/discover";
import { handleError, json } from "@/lib/http";
import { CURRENT_USER_ID } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const db = await getDb();
    const profiles = await getFeed(db, CURRENT_USER_ID, limitParam ? Number(limitParam) : undefined);
    return json({ profiles });
  } catch (err) {
    return handleError(err);
  }
}
