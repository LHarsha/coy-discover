# Coy Discover

A swipe-based Discover tab for Coy, built as a standalone Next.js app. It has a blank Home tab (standing in for Coy's existing experience) and a Discover tab with a card deck, mutual matching and a Matches view.

The main constraint is Coy's core promise: nobody finds out you liked them unless they liked you back. Most of the design choices below follow from that.

Notes from using the live app, plus two feature suggestions, are in [PART_A.md](PART_A.md).

## Running it

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit + API tests (Vitest)
npm run build      # production build
```

On first start, the app creates `data/coy.db` (SQLite) and seeds it with 32 profiles. Nine of them have already liked the current user, so matches can happen in a demo. To start over, delete that file or use "Reset demo data" on the empty state.

## What it does

The deck shows one card at a time, with the next one tucked behind it. Drag right to like or left to pass. On desktop, use the buttons or the arrow keys. A LIKE or NOPE stamp fades in as you drag. Past a distance or velocity threshold the card flies off; otherwise it springs back.

Each swipe gets a short confirmation message. A mutual like opens the "It's a match!" screen. Matches are listed under Discover → Matches, newest first. The deck also has a loading state, an error state with retry, and an empty state for when you've seen everyone.

The styling follows Coy's own app: Bricolage Grotesque, ink outlines with hard offset shadows, and pink and lilac accents. The seed photos are 128px, so cards show them as a round avatar on a dotted panel instead of stretching them full-bleed. Layouts are tuned down to an iPhone SE with Safari's toolbars showing (375×548).

Swipes and matches are stored in SQLite, so they survive reloads and server restarts. A profile you've swiped on never comes back.

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

- Every swipe, including the seeded "they liked you" data, is a row in `swipes(swiper_id, target_id, action)`. A match row is written only when both directions are `like`.
- `getFeed` filters only on the current user's own swipes and never reads anyone else's. The feed's contents and order are the same whether or not someone has liked you.
- The feed is sorted by a fixed, shuffled rank set at seed time. If profiles that liked you came first, the order alone would give it away.
- A pass and an unreturned like both return `{ "matched": false }`. A test checks that the two response bodies are identical.
- `toPublicProfile` copies fields one at a time, so a new column can't leak through the API by accident. Tests check the exact key set, and that the feed response never contains the word "like".
- Who liked whom lives in `src/lib/seed.ts`, which only server code imports. Client components get the current user's display info from `src/lib/me.ts`, so the seed data never reaches the browser bundle.
- The swipe insert and the conditional match insert run in a single write batch. A repeat swipe hits the `(swiper_id, target_id)` primary key, and the whole batch rolls back. The `user_a < user_b` check means each pair is stored once.
- API responses send `Cache-Control: no-store`, so shared caches don't keep per-user data.

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
  global-setup.ts              temp directory for test databases, removed after the run
```

## Decisions and limitations

- The brief assumes one logged-in user, so the current user is the fixed id `me`. The logic still takes a `userId` everywhere, and the current user is an ordinary row in `profiles`, so real auth only needs to swap the constant for the session's user id. Until then, anyone who can reach the server acts as `me`.
- `@libsql/client` uses a local SQLite file in development, and the same code talks to a hosted Turso database in production.
- Swipes are optimistic: the card leaves at once and the request runs in the background. If it fails, the card goes back on top of the deck and an error message appears.
- There's no undo, and seeded profiles never swipe on their own, so the only possible matches are the nine seeded likes.
- Profile photos load from randomuser.me, so cards show no images offline.

## Deploying (Vercel + Turso)

Vercel's filesystem doesn't persist between requests, so production needs a hosted database:

1. Create a Turso database and get its URL and auth token.
2. Set `DATABASE_URL=libsql://<db>.turso.io` and `DATABASE_AUTH_TOKEN=<token>` in the Vercel project settings.
3. Deploy. The schema is created and seeded on the first request. Optionally, set `ALLOW_DEMO_RESET=true` to keep the reset button working in a public demo.
