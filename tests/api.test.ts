import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { SEED_PROFILES } from "@/lib/seed";

// Set before the routes are imported so the shared client opens a throwaway database.
const dir = fs.mkdtempSync(path.join(inject("tmpRoot"), "api-"));
process.env.DATABASE_URL = `file:${path.join(dir, "api.db")}`;

const feedRoute = await import("@/app/api/feed/route");
const swipeRoute = await import("@/app/api/swipe/route");
const matchesRoute = await import("@/app/api/matches/route");
const { getDb } = await import("@/lib/db");

const liker = SEED_PROFILES.find((p) => p.likesCurrentUser)!.id;
const nonLiker = SEED_PROFILES.find((p) => !p.likesCurrentUser)!.id;

function swipe(body: unknown) {
  return swipeRoute.POST(
    new Request("http://localhost/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function feedIds() {
  const res = await feedRoute.GET(new NextRequest("http://localhost/api/feed"));
  const data = await res.json();
  return data.profiles.map((p: { id: string }) => p.id) as string[];
}

beforeAll(async () => {
  await getDb();
});

afterAll(async () => {
  (await getDb()).close();
});

describe("HTTP API", () => {
  it("GET /api/feed returns unswiped profiles with no like signal anywhere in the body", async () => {
    const res = await feedRoute.GET(new NextRequest("http://localhost/api/feed"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).not.toMatch(/like/i);
    expect(JSON.parse(text).profiles).toHaveLength(SEED_PROFILES.length);
  });

  it("POST /api/swipe returns an identical body for a non-mutual like and a pass", async () => {
    const like = await swipe({ profileId: nonLiker, action: "like" });
    const otherNonLiker = SEED_PROFILES.filter((p) => !p.likesCurrentUser)[1].id;
    const pass = await swipe({ profileId: otherNonLiker, action: "pass" });
    expect(like.status).toBe(201);
    expect(pass.status).toBe(201);
    expect(await like.text()).toBe(await pass.text());
  });

  it("POST /api/swipe reports a match and GET /api/matches lists it", async () => {
    const res = await swipe({ profileId: liker, action: "like" });
    const data = await res.json();
    expect(data.matched).toBe(true);
    expect(data.match.profile.id).toBe(liker);

    const matches = await (await matchesRoute.GET()).json();
    expect(matches.matches.map((m: { profile: { id: string } }) => m.profile.id)).toEqual([liker]);
    expect(await feedIds()).not.toContain(liker);
  });

  it("returns clear errors for bad requests", async () => {
    expect((await swipe("not json")).status).toBe(400);
    expect((await swipe({ profileId: liker })).status).toBe(400);
    expect((await swipe({ profileId: "nope", action: "like" })).status).toBe(404);
    const repeat = await swipe({ profileId: liker, action: "pass" });
    expect(repeat.status).toBe(409);
    expect((await repeat.json()).error.code).toBe("already_swiped");
  });
});
