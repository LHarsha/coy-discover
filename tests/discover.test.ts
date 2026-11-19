import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import type { Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { openDb, resetDemo } from "@/lib/db";
import { DiscoverError, getFeed, getMatches, parseSwipeInput, recordSwipe } from "@/lib/discover";
import { CURRENT_USER_ID as ME, SEED_PROFILES } from "@/lib/seed";

const likers = SEED_PROFILES.filter((p) => p.likesCurrentUser).map((p) => p.id);
const nonLikers = SEED_PROFILES.filter((p) => !p.likesCurrentUser).map((p) => p.id);
const PUBLIC_KEYS = ["age", "bio", "id", "interests", "location", "name", "photoUrl"];

let db: Client;

beforeEach(async () => {
  db = await openDb(":memory:");
});

afterEach(() => {
  db.close();
});

async function expectDiscoverError(promise: Promise<unknown>, code: string, status: number) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DiscoverError);
  expect((err as DiscoverError).code).toBe(code);
  expect((err as DiscoverError).status).toBe(status);
}

describe("seed data", () => {
  it("has at least 30 profiles, some of which already like the user", () => {
    expect(SEED_PROFILES.length).toBeGreaterThanOrEqual(30);
    expect(likers.length).toBeGreaterThan(0);
    expect(new Set(SEED_PROFILES.map((p) => p.id)).size).toBe(SEED_PROFILES.length);
  });

  it("does not reseed a database that already has data", async () => {
    await recordSwipe(db, ME, nonLikers[0], "pass");
    const again = await openDb(":memory:");
    expect(await getFeed(again, ME)).toHaveLength(SEED_PROFILES.length);
    again.close();
    expect(await getFeed(db, ME)).toHaveLength(SEED_PROFILES.length - 1);
  });
});

describe("getFeed", () => {
  it("returns every seeded profile except the user", async () => {
    const feed = await getFeed(db, ME);
    expect(feed).toHaveLength(SEED_PROFILES.length);
    expect(feed.map((p) => p.id)).not.toContain(ME);
  });

  it("excludes profiles the user has liked or passed", async () => {
    await recordSwipe(db, ME, nonLikers[0], "like");
    await recordSwipe(db, ME, nonLikers[1], "pass");
    await recordSwipe(db, ME, likers[0], "pass");
    const ids = (await getFeed(db, ME)).map((p) => p.id);
    expect(ids).not.toContain(nonLikers[0]);
    expect(ids).not.toContain(nonLikers[1]);
    expect(ids).not.toContain(likers[0]);
    expect(ids).toHaveLength(SEED_PROFILES.length - 3);
  });

  it("is empty once everything has been swiped", async () => {
    for (const p of SEED_PROFILES) await recordSwipe(db, ME, p.id, "pass");
    expect(await getFeed(db, ME)).toEqual([]);
  });

  it("only exposes public profile fields", async () => {
    for (const profile of await getFeed(db, ME)) {
      expect(Object.keys(profile).sort()).toEqual(PUBLIC_KEYS);
    }
  });

  it("does not front-load the profiles that liked the user", async () => {
    const ids = (await getFeed(db, ME)).map((p) => p.id);
    const firstN = ids.slice(0, likers.length);
    expect(firstN.every((id) => likers.includes(id))).toBe(false);
  });

  it("respects and clamps the limit", async () => {
    expect(await getFeed(db, ME, 5)).toHaveLength(5);
    expect(await getFeed(db, ME, -3)).toHaveLength(1);
  });
});

describe("recordSwipe", () => {
  it("creates a match when liking someone who already liked the user", async () => {
    const result = await recordSwipe(db, ME, likers[0], "like");
    expect(result.matched).toBe(true);
    expect(result.match?.profile.id).toBe(likers[0]);
    expect(Object.keys(result.match!.profile).sort()).toEqual(PUBLIC_KEYS);
  });

  it("does not match when the other person has not liked the user", async () => {
    expect(await recordSwipe(db, ME, nonLikers[0], "like")).toEqual({ matched: false });
    expect(await getMatches(db, ME)).toEqual([]);
  });

  it("never matches on a pass, even if the other person liked the user", async () => {
    expect(await recordSwipe(db, ME, likers[0], "pass")).toEqual({ matched: false });
    expect(await getMatches(db, ME)).toEqual([]);
  });

  it("gives the same response for a pass and an unreturned like", async () => {
    const pass = await recordSwipe(db, ME, likers[0], "pass");
    const like = await recordSwipe(db, ME, nonLikers[0], "like");
    expect(pass).toEqual(like);
  });

  it("matches when the other side likes second", async () => {
    const someoneNew = nonLikers[0];
    await recordSwipe(db, ME, someoneNew, "like");
    const result = await recordSwipe(db, someoneNew, ME, "like");
    expect(result.matched).toBe(true);
    expect((await getMatches(db, ME)).map((m) => m.profile.id)).toEqual([someoneNew]);
  });

  it("rejects a second swipe on the same profile without changing anything", async () => {
    await recordSwipe(db, ME, likers[0], "pass");
    await expectDiscoverError(recordSwipe(db, ME, likers[0], "like"), "already_swiped", 409);
    expect(await getMatches(db, ME)).toEqual([]);
  });

  it("rejects unknown profiles, self-swipes and invalid actions", async () => {
    await expectDiscoverError(recordSwipe(db, ME, "nobody", "like"), "not_found", 404);
    await expectDiscoverError(recordSwipe(db, ME, ME, "like"), "invalid_request", 400);
    await expectDiscoverError(recordSwipe(db, ME, likers[0], "superlike" as never), "invalid_request", 400);
  });
});

describe("getMatches", () => {
  it("lists only mutual matches, newest first", async () => {
    await recordSwipe(db, ME, likers[0], "like");
    await recordSwipe(db, ME, nonLikers[0], "like");
    await recordSwipe(db, ME, likers[1], "pass");
    await new Promise((r) => setTimeout(r, 5));
    await recordSwipe(db, ME, likers[2], "like");
    const ids = (await getMatches(db, ME)).map((m) => m.profile.id);
    expect(ids).toEqual([likers[2], likers[0]]);
  });

  it("does not reveal pending likes before the user has swiped", async () => {
    expect(await getMatches(db, ME)).toEqual([]);
  });
});

describe("parseSwipeInput", () => {
  it("accepts a valid body", () => {
    expect(parseSwipeInput({ profileId: "u01", action: "like" })).toEqual({ profileId: "u01", action: "like" });
  });

  it.each([null, "like", [], {}, { profileId: "", action: "like" }, { profileId: "u01" }, { profileId: 1, action: "pass" }, { profileId: "u01", action: "LIKE" }])(
    "rejects %j",
    (body) => {
      expect(() => parseSwipeInput(body)).toThrow(DiscoverError);
    },
  );
});

describe("persistence and reset", () => {
  it("keeps swipes and matches across connections to the same database file", async () => {
    const dir = fs.mkdtempSync(path.join(inject("tmpRoot"), "persist-"));
    const url = `file:${path.join(dir, "test.db")}`;

    const first = await openDb(url);
    await recordSwipe(first, ME, likers[0], "like");
    await recordSwipe(first, ME, nonLikers[0], "pass");
    first.close();

    const second = await openDb(url);
    expect((await getMatches(second, ME)).map((m) => m.profile.id)).toEqual([likers[0]]);
    const ids = (await getFeed(second, ME)).map((p) => p.id);
    expect(ids).not.toContain(likers[0]);
    expect(ids).not.toContain(nonLikers[0]);
    second.close();
  });

  it("resetDemo restores the seeded state", async () => {
    await recordSwipe(db, ME, likers[0], "like");
    await resetDemo(db);
    expect(await getMatches(db, ME)).toEqual([]);
    expect(await getFeed(db, ME)).toHaveLength(SEED_PROFILES.length);
    expect((await recordSwipe(db, ME, likers[0], "like")).matched).toBe(true);
  });
});
