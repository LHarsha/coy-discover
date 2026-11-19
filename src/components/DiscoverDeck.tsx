"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Match, PublicProfile, SwipeAction } from "@/lib/types";
import { MatchModal } from "./MatchModal";
import { SwipeCard } from "./SwipeCard";

type Status = "loading" | "ready" | "error";

const STACK_SIZE = 3;
const TOAST_MS = 1800;

export function DiscoverDeck() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [direction, setDirection] = useState(1);
  const [match, setMatch] = useState<Match | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const profilesRef = useRef(profiles);

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const showToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const fetchFeed = useCallback(
    () =>
      api.feed().then(
        (list) => {
          setProfiles(list);
          setStatus("ready");
        },
        () => setStatus("error"),
      ),
    [],
  );

  const load = useCallback(() => {
    setStatus("loading");
    return fetchFeed();
  }, [fetchFeed]);

  // Status starts as "loading", so the first fetch only needs to settle it.
  useEffect(() => {
    fetchFeed();
    return () => clearTimeout(toastTimer.current);
  }, [fetchFeed]);

  const save = useCallback(
    async (profile: PublicProfile, action: SwipeAction) => {
      try {
        const result = await api.swipe(profile.id, action);
        if (result.matched && result.match) setMatch(result.match);
        else showToast(action === "like" ? `Liked ${profile.name}` : `Passed on ${profile.name}`);
      } catch (err) {
        if (err instanceof ApiError && err.code === "already_swiped") return;
        setProfiles((list) => (list.some((p) => p.id === profile.id) ? list : [profile, ...list]));
        showToast("Couldn't save that. Try again.");
      }
    },
    [showToast],
  );

  // The top card leaves the stack immediately, so the next one moves up while the old one
  // is still flying out; the request runs in the background.
  const decide = useCallback(
    (action: SwipeAction) => {
      const top = profilesRef.current[0];
      if (!top) return;
      setDirection(action === "like" ? 1 : -1);
      setProfiles((list) => list.filter((p) => p.id !== top.id));
      save(top, action);
    },
    [save],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || e.repeat) return;
      if (e.key === "ArrowRight") decide("like");
      if (e.key === "ArrowLeft") decide("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, match]);

  const resetDemo = async () => {
    try {
      await api.reset();
      await load();
    } catch {
      showToast("Reset isn't available here.");
    }
  };

  const empty = status === "ready" && profiles.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-4">
      <div className="relative min-h-[21rem] flex-1 short:min-h-[18rem]">
        {status === "loading" && <div className="dots absolute inset-0 animate-pulse rounded-[26px] border-2 border-line" />}

        {status === "error" && (
          <EmptyCard title="Couldn't load profiles" body="Check your connection and try again.">
            <button type="button" onClick={load} className="btn">
              Try again
            </button>
          </EmptyCard>
        )}

        {empty && (
          <EmptyCard title="That's everyone for now" body="New people show up here as they join Coy.">
            <Link href="/discover/matches" className="btn">
              See your matches
            </Link>
            <button type="button" onClick={resetDemo} className="text-[0.875rem] font-semibold text-muted underline underline-offset-4">
              Reset demo data
            </button>
          </EmptyCard>
        )}

        {status === "ready" && (
          <AnimatePresence custom={direction}>
            {profiles.slice(0, STACK_SIZE).map((profile, depth) => (
              <SwipeCard key={profile.id} profile={profile} depth={depth} onDecide={decide} />
            ))}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: -8, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -8, x: "-50%" }}
              className="pointer-events-none absolute top-3 left-1/2 z-20 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-[0.875rem] font-bold whitespace-nowrap shadow-[3px_3px_0_var(--color-ink)]"
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`relative z-20 flex items-center justify-center gap-10 pt-8 short:pt-5 ${status === "ready" && !empty ? "" : "invisible"}`}>
        <RoundButton label="Pass" shortcut="←" onClick={() => decide("pass")} className="bg-white">
          <path d="M7 7l10 10M17 7 7 17" />
        </RoundButton>
        <RoundButton label="Like" shortcut="→" onClick={() => decide("like")} className="bg-pink">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="currentColor" />
        </RoundButton>
      </div>

      <MatchModal match={match} onClose={() => setMatch(null)} />
    </div>
  );
}

function RoundButton({
  label,
  shortcut,
  onClick,
  className,
  children,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={`${label} (${shortcut})`}
      onClick={onClick}
      className={`pressable grid h-16 w-16 place-items-center short:h-14 short:w-14 rounded-full border-2 border-ink text-ink shadow-[3px_3px_0_var(--color-ink)] transition-[transform,box-shadow] duration-75 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function EmptyCard({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[26px] border-2 border-dashed border-line px-8 text-center">
      <div className="dots grid h-20 w-20 place-items-center rounded-full border-2 border-ink">
        <span className="h-4 w-4 rounded-full bg-pink" />
      </div>
      <h2 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">{title}</h2>
      <p className="text-muted">{body}</p>
      {children}
    </div>
  );
}
