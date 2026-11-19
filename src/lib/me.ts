import type { PublicProfile } from "./types";

// Kept apart from seed.ts so client components can import it without bundling
// the seed data, which records who has liked the user.
export const CURRENT_USER_ID = "me";

export const CURRENT_USER: PublicProfile = {
  id: CURRENT_USER_ID,
  name: "You",
  age: 22,
  photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  bio: "Trying out Discover.",
  location: "Bengaluru",
  interests: ["Music", "Startups"],
};
