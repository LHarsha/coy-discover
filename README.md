# Coy Discover

A swipe-based **Discover** tab for Coy, built as a standalone Next.js app. It has a blank **Home** tab (a stand-in for Coy's existing experience) and a **Discover** tab with a card deck, mutual matching, and a Matches view.

The main constraint is Coy's core promise: **nobody finds out you liked them unless they liked you too.** Most of the design choices below follow from that.

## Running it

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit + API tests (Vitest)
npm run build      # production build
```

On first start, the app creates `data/coy.db` (SQLite) and seeds it with 32 profiles. Nine of them have already liked the current user, so matches can happen in a demo. Delete that file, or use **Reset demo data** on the empty state, to start over.

## Features

- **Swipe deck**: one card at a time, with the next card peeking out behind it. Drag right to like and left to pass. On desktop, use the buttons or the ← / → keys. A LIKE / NOPE stamp fades in as you drag, and past a distance or velocity threshold the card flies off. Otherwise it springs back.
- **Feedback**: a toast confirms each swipe. A mutual like opens a full-screen **"It's a match!"** screen.
- **Matches**: a grid of mutual matches, newest first.
- **States**: loading skeleton, error with retry, and a "You're all caught up" empty state.
- **Persistence**: swipes and matches are stored in SQLite, so they survive reloads and server restarts. A swiped profile never shows up again.

## API

The endpoints live under `/api/*`. They're also available at the paths named in the brief (`/feed`, `/swipe`, `/matches`) through rewrites.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/feed?limit=50` | Profiles the user has not swiped on yet. |
| `POST` | `/api/swipe` | Body `{ "profileId": "u01", "action": "like" \| "pass" }`. Returns `201 { "matched": false }`, or `201 { "matched": true, "match": { "profile", "matchedAt" } }`. |
| `GET` | `/api/matches` | The user's mutual matches. |
| `POST` | `/api/reset` | Restores the seeded demo data. Disabled in production unless `ALLOW_DEMO_RESET=true`. |

Errors use the shape `{ "error": { "code", "message" } }`:
- `400 invalid_request`: malformed JSON, missing `profileId`, unknown action, or swiping on yourself.
- `404 not_found`: unknown profile.
- `409 already_swiped`: the user has already swiped on this profile.

## Privacy design

- **Likes are just swipes.** Every swipe, including seeded "they liked you" data, is a row in `swipes(swiper_id, target_id, action)`. A match row is written only when both directions are `like`.
- **The feed never reads other people's swipes.** `getFeed` filters only on the current user's own swipes. Its contents and order are the same whether or not someone has liked you.
- **No ordering leak.** The feed is sorted by a fixed shuffled rank set at seed time. If profiles that liked you were shown first, or grouped together, the order itself would give away the secret.
- **Indistinguishable responses.** A pass and an unreturned like both return exactly `{ "matched": false }`. A test checks that the response bodies are byte-for-byte identical.
- **Allowlisted output.** `toPublicProfile` copies fields one by one, so a new column can't leak through an API response by accident. Tests assert the exact key set and that the feed body never contains "like".
- **The seed data stays on the server.** The data about who liked whom lives in `src/lib/seed.ts`, which only server code imports. Client components import the current user's display info from `src/lib/me.ts`, so the seed data never ends up in the browser bundle.
- **Atomic matching.** The swipe insert and the conditional match insert run in one write batch. A repeat swipe fails on the `(swiper_id, target_id)` primary key and rolls back the whole batch. A check constraint (`user_a < user_b`) stores each pair only once.
- **No caching.** API responses send `Cache-Control: no-store`, so a shared cache can't hold onto per-user data.

## Project structure

```
src/
  app/
    home/page.tsx              blank Home tab
    discover/page.tsx          swipe deck
    discover/matches/page.tsx  mutual matches
    api/{feed,swipe,matches,reset}/route.ts
  components/                  TabBar, DiscoverHeader, DiscoverDeck, SwipeCard, MatchModal
  lib/
    discover.ts                feed / swipe / match logic (framework-free, takes a db client)
    db.ts                      schema, seeding, shared client
    seed.ts                    mock profiles (server only)
    me.ts                      current user (safe for the client)
    types.ts, api.ts, http.ts
tests/
  discover.test.ts             domain logic against an in-memory SQLite db
  api.test.ts                  route handlers against a temporary SQLite file
```

## Decisions and trade-offs

- **Single user.** The brief assumes one logged-in user, so the current user is the fixed id `me`. The schema and logic still take a `userId` everywhere, and the current user is an ordinary row in `profiles`. Adding real auth means swapping the constant for the session's user id.
- **libSQL client.** `@libsql/client` reads a local SQLite file in development and talks to a hosted libSQL/Turso database with the same code, which keeps deployment simple.
- **Optimistic swipes.** The card leaves the screen right away, and the swipe is saved in the background. If the request fails, the card goes back on top of the deck and an error toast appears.

## Deploying (Vercel + Turso)

Vercel's filesystem doesn't persist between requests, so production needs a hosted database:

1. Create a Turso database and get its URL and auth token.
2. Set `DATABASE_URL=libsql://<db>.turso.io` and `DATABASE_AUTH_TOKEN=<token>` in the Vercel project settings.
3. Deploy. The schema is created and seeded on the first request. Optionally, set `ALLOW_DEMO_RESET=true` to keep the reset button working in a public demo.
