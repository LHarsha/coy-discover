import { createClient, type Client, type InStatement } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { CURRENT_USER, CURRENT_USER_ID, SEED_PROFILES, feedRanks } from "./seed";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    age        INTEGER NOT NULL,
    photo_url  TEXT NOT NULL,
    bio        TEXT NOT NULL,
    location   TEXT NOT NULL,
    interests  TEXT NOT NULL,
    feed_rank  INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS swipes (
    swiper_id  TEXT NOT NULL REFERENCES profiles(id),
    target_id  TEXT NOT NULL REFERENCES profiles(id),
    action     TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (swiper_id, target_id),
    CHECK (swiper_id <> target_id)
  )`,
  `CREATE INDEX IF NOT EXISTS swipes_by_target ON swipes (target_id, swiper_id)`,
  `CREATE TABLE IF NOT EXISTS matches (
    user_a     TEXT NOT NULL REFERENCES profiles(id),
    user_b     TEXT NOT NULL REFERENCES profiles(id),
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_a, user_b),
    CHECK (user_a < user_b)
  )`,
];

export async function migrate(db: Client): Promise<void> {
  await db.batch(SCHEMA, "write");
}

function seedStatements(now: string): InStatement[] {
  const ranks = feedRanks(SEED_PROFILES.map((p) => p.id));
  const all = [CURRENT_USER, ...SEED_PROFILES];
  const statements: InStatement[] = all.map((p) => ({
    sql: `INSERT INTO profiles (id, name, age, photo_url, bio, location, interests, feed_rank)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [p.id, p.name, p.age, p.photoUrl, p.bio, p.location, JSON.stringify(p.interests), ranks.get(p.id) ?? 0],
  }));
  for (const p of SEED_PROFILES) {
    if (p.likesCurrentUser) {
      statements.push({
        sql: `INSERT INTO swipes (swiper_id, target_id, action, created_at) VALUES (?, ?, 'like', ?)`,
        args: [p.id, CURRENT_USER_ID, now],
      });
    }
  }
  return statements;
}

export async function seedIfEmpty(db: Client): Promise<void> {
  const { rows } = await db.execute("SELECT COUNT(*) AS n FROM profiles");
  if (Number(rows[0].n) > 0) return;
  await db.batch(seedStatements(new Date().toISOString()), "write");
}

/** Wipes all swipes and matches and restores the seeded data. Used by the demo reset endpoint and tests. */
export async function resetDemo(db: Client): Promise<void> {
  await db.batch(
    ["DELETE FROM matches", "DELETE FROM swipes", "DELETE FROM profiles", ...seedStatements(new Date().toISOString())],
    "write",
  );
}

export async function openDb(url: string, authToken?: string): Promise<Client> {
  const db = createClient({ url, authToken });
  await migrate(db);
  await seedIfEmpty(db);
  return db;
}

function defaultUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return `file:${path.join(dir, "coy.db")}`;
}

const globalForDb = globalThis as unknown as { coyDb?: Promise<Client> };

/** Shared client for the app; cached on globalThis so dev hot reloads reuse one connection. */
export function getDb(): Promise<Client> {
  if (!globalForDb.coyDb) {
    globalForDb.coyDb = openDb(defaultUrl(), process.env.DATABASE_AUTH_TOKEN).catch((err) => {
      globalForDb.coyDb = undefined;
      throw err;
    });
  }
  return globalForDb.coyDb;
}
