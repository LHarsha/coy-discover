"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Match, PublicProfile, SwipeAction } from "@/lib/types";
import { MatchModal } from "./MatchModal";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";

type Status = "loading" | "ready" | "error";

interface Toast {
  id: number;
  text: string;
  tone: "like" | "pass" | "error";
}

export function DiscoverDeck() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [match, setMatch] = useState<Match | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const topCard = useRef<SwipeCardHandle>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((text: string, tone: Toast["tone"]) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setProfiles(await api.feed());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Initial fetch of the feed when the deck mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => clearTimeout(toastTimer.current);
  }, [load]);

  const handleSwiped = useCallback(
    async (profile: PublicProfile, action: SwipeAction) => {
      // The card has already left the screen; remove it now and record the swipe in the background.
      setProfiles((list) => list.filter((p) => p.id !== profile.id));
      try {
        const result = await api.swipe(profile.id, action);
        if (result.matched && result.match) {
          setMatch(result.match);
        } else {
          showToast(action === "like" ? `You liked ${profile.name}` : `Passed on ${profile.name}`, action);
        }
      } catch (err) {
        if (err instanceof ApiError && err.code === "already_swiped") return;
        setProfiles((list) => (list.some((p) => p.id === profile.id) ? list : [profile, ...list]));
        showToast("Couldn't save that swipe. Try again.", "error");
      }
    },
    [showToast],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") topCard.current?.swipe("like");
      if (e.key === "ArrowLeft") topCard.current?.swipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match]);

  const resetDemo = async () => {
    try {
      await api.reset();
      await load();
    } catch {
      showToast("Reset is not available here.", "error");
    }
  };

  const visible = profiles.slice(0, 2);
  const empty = status === "ready" && profiles.length === 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-4">
      <div className="relative min-h-[22rem] flex-1">
        {status === "loading" && <div className="absolute inset-0 animate-pulse rounded-3xl bg-neutral-200" />}

        {status === "error" && (
          <CenteredMessage title="Couldn't load profiles" body="Check your connection and try again.">
            <button type="button" onClick={load} className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white">
              Retry
            </button>
          </CenteredMessage>
        )}

        {empty && (
          <CenteredMessage
            title="You're all caught up"
            body="You've seen everyone for now. New people will show up here as they join."
          >
            <Link href="/discover/matches" className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white">
              See your matches
            </Link>
            <button type="button" onClick={resetDemo} className="text-sm text-black/40 underline underline-offset-2">
              Reset demo data
            </button>
          </CenteredMessage>
        )}

        {status === "ready" &&
          visible
            .map((profile, i) => (
              <SwipeCard
                key={profile.id}
                ref={i === 0 ? topCard : undefined}
                profile={profile}
                isTop={i === 0}
                onSwiped={(action) => handleSwiped(profile, action)}
              />
            ))
            .reverse()}
      </div>

      {status === "ready" && !empty && (
        <div className="flex items-center justify-center gap-8 pt-4">
          <ActionButton label="Pass" onClick={() => topCard.current?.swipe("pass")} className="text-rose-500">
            <path d="M6 6l12 12M18 6 6 18" />
          </ActionButton>
          <ActionButton label="Like" onClick={() => topCard.current?.swipe("like")} className="text-emerald-500">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
          </ActionButton>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`pointer-events-none absolute inset-x-0 bottom-24 z-20 mx-auto w-fit rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
              toast.tone === "like" ? "bg-emerald-500" : toast.tone === "pass" ? "bg-neutral-800" : "bg-rose-600"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <MatchModal match={match} onClose={() => setMatch(null)} />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={`${label} (${label === "Like" ? "→" : "←"})`}
      onClick={onClick}
      className={`flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-90 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function CenteredMessage({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-black/10 px-8 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-black/55">{body}</p>
      {children}
    </div>
  );
}
