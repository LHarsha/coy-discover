import type { Match, PublicProfile, SwipeAction, SwipeResult } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status})`, res.status, data?.error?.code);
  }
  return data as T;
}

export const api = {
  feed: () => request<{ profiles: PublicProfile[] }>("/api/feed").then((d) => d.profiles),
  matches: () => request<{ matches: Match[] }>("/api/matches").then((d) => d.matches),
  swipe: (profileId: string, action: SwipeAction) =>
    request<SwipeResult>("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, action }),
    }),
  reset: () => request<{ ok: true }>("/api/reset", { method: "POST" }),
};
