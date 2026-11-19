"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { CURRENT_USER } from "@/lib/me";
import type { Match } from "@/lib/types";

interface Props {
  match: Match | null;
  onClose: () => void;
}

export function MatchModal({ match, onClose }: Props) {
  useEffect(() => {
    if (!match) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match, onClose]);

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          key={match.profile.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-title"
          className="fixed inset-0 z-30 mx-auto flex max-w-md flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-brand to-fuchsia-700 px-8 py-10 text-center text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.h2
            id="match-title"
            className="text-4xl font-extrabold italic"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
          >
            It&apos;s a match!
          </motion.h2>
          <p className="mt-2 text-white/85">You and {match.profile.name} liked each other.</p>

          <div className="my-10 flex items-center">
            {[CURRENT_USER.photoUrl, match.profile.photoUrl].map((src, i) => (
              <motion.div
                key={src}
                className={`relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-2xl ${i === 1 ? "-ml-6" : ""}`}
                initial={{ x: i === 0 ? -80 : 80, rotate: i === 0 ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, rotate: i === 0 ? -6 : 6, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.2 }}
              >
                <Image src={src} alt={i === 0 ? "You" : match.profile.name} fill sizes="128px" className="object-cover" />
              </motion.div>
            ))}
          </div>

          <div className="flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/discover/matches"
              className="rounded-full bg-white py-3 font-semibold text-brand shadow-lg transition-transform active:scale-95"
            >
              View matches
            </Link>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="rounded-full border-2 border-white/70 py-3 font-semibold transition-transform active:scale-95"
            >
              Keep swiping
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
