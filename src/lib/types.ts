export type SwipeAction = "like" | "pass";

export const SWIPE_ACTIONS: readonly SwipeAction[] = ["like", "pass"];

/**
 * The only shape of another user's profile that ever leaves the server.
 * It intentionally carries nothing about how that user has swiped.
 */
export interface PublicProfile {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  location: string;
  interests: string[];
}

export interface Match {
  profile: PublicProfile;
  matchedAt: string;
}

export interface SwipeResult {
  matched: boolean;
  match?: Match;
}
