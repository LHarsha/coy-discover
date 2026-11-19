import type { Client, Row } from "@libsql/client";
import { SWIPE_ACTIONS, type Match, type PublicProfile, type SwipeAction, type SwipeResult } from "./types";

export class DiscoverError extends Error {
  constructor(
    public readonly code: "invalid_request" | "not_found" | "already_swiped",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DiscoverError";
  }
}

const PROFILE_COLUMNS = "p.id, p.name, p.age, p.photo_url, p.bio, p.location, p.interests";

/** Builds the public view field by field, so new columns never leak by accident. */
export function toPublicProfile(row: Row): PublicProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    age: Number(row.age),
    photoUrl: String(row.photo_url),
    bio: String(row.bio),
    location: String(row.location),
    interests: JSON.parse(String(row.interests)) as string[],
  };
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function isConstraintError(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  return typeof code === "string" && code.startsWith("SQLITE_CONSTRAINT");
}

/**
 * Profiles the user has not swiped on yet. Deliberately never reads swipes made *by* other
 * users, so neither the contents nor the order of the feed depend on who liked whom.
 */
export async function getFeed(db: Client, userId: string, limit = 50): Promise<PublicProfile[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 0, 1), 100);
  const { rows } = await db.execute({
    sql: `SELECT ${PROFILE_COLUMNS}
          FROM profiles p
          WHERE p.id <> ?
            AND NOT EXISTS (
              SELECT 1 FROM swipes s WHERE s.swiper_id = ? AND s.target_id = p.id
            )
          ORDER BY p.feed_rank, p.id
          LIMIT ?`,
    args: [userId, userId, safeLimit],
  });
  return rows.map(toPublicProfile);
}

export function parseSwipeInput(body: unknown): { profileId: string; action: SwipeAction } {
  if (typeof body !== "object" || body === null) {
    throw new DiscoverError("invalid_request", "Body must be a JSON object", 400);
  }
  const { profileId, action } = body as Record<string, unknown>;
  if (typeof profileId !== "string" || profileId.trim() === "") {
    throw new DiscoverError("invalid_request", "profileId must be a non-empty string", 400);
  }
  if (typeof action !== "string" || !SWIPE_ACTIONS.includes(action as SwipeAction)) {
    throw new DiscoverError("invalid_request", `action must be one of: ${SWIPE_ACTIONS.join(", ")}`, 400);
  }
  return { profileId, action: action as SwipeAction };
}

/**
 * Records a swipe and creates a match if, and only if, both sides have now liked each other.
 * A pass and an unreturned like produce the same response, so the caller learns nothing about
 * the other person's choice unless it is mutual.
 */
export async function recordSwipe(
  db: Client,
  swiperId: string,
  targetId: string,
  action: SwipeAction,
): Promise<SwipeResult> {
  if (!SWIPE_ACTIONS.includes(action)) {
    throw new DiscoverError("invalid_request", "Unknown swipe action", 400);
  }
  if (swiperId === targetId) {
    throw new DiscoverError("invalid_request", "You cannot swipe on yourself", 400);
  }

  const target = await db.execute({ sql: "SELECT 1 FROM profiles WHERE id = ?", args: [targetId] });
  if (target.rows.length === 0) {
    throw new DiscoverError("not_found", "Profile not found", 404);
  }

  const now = new Date().toISOString();
  const [userA, userB] = orderedPair(swiperId, targetId);

  let matchCreated: boolean;
  try {
    // One atomic batch: the swipe insert fails on a repeat swipe (primary key), which rolls back
    // the whole batch, and the match is only inserted when the reverse like already exists.
    const results = await db.batch(
      [
        {
          sql: "INSERT INTO swipes (swiper_id, target_id, action, created_at) VALUES (?, ?, ?, ?)",
          args: [swiperId, targetId, action, now],
        },
        {
          sql: `INSERT OR IGNORE INTO matches (user_a, user_b, created_at)
                SELECT ?, ?, ?
                WHERE ? = 'like'
                  AND EXISTS (
                    SELECT 1 FROM swipes
                    WHERE swiper_id = ? AND target_id = ? AND action = 'like'
                  )`,
          args: [userA, userB, now, action, targetId, swiperId],
        },
      ],
      "write",
    );
    matchCreated = results[1].rowsAffected > 0;
  } catch (err) {
    if (isConstraintError(err)) {
      throw new DiscoverError("already_swiped", "You have already swiped on this profile", 409);
    }
    throw err;
  }

  if (!matchCreated) return { matched: false };

  const { rows } = await db.execute({
    sql: `SELECT ${PROFILE_COLUMNS}, m.created_at AS matched_at
          FROM matches m JOIN profiles p ON p.id = ?
          WHERE m.user_a = ? AND m.user_b = ?`,
    args: [targetId, userA, userB],
  });
  return {
    matched: true,
    match: { profile: toPublicProfile(rows[0]), matchedAt: String(rows[0].matched_at) },
  };
}

export async function getMatches(db: Client, userId: string): Promise<Match[]> {
  const { rows } = await db.execute({
    sql: `SELECT ${PROFILE_COLUMNS}, m.created_at AS matched_at
          FROM matches m
          JOIN profiles p ON p.id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END
          WHERE m.user_a = ? OR m.user_b = ?
          ORDER BY m.created_at DESC, p.id`,
    args: [userId, userId, userId],
  });
  return rows.map((row) => ({ profile: toPublicProfile(row), matchedAt: String(row.matched_at) }));
}
