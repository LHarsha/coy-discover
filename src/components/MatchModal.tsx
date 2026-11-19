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
          className="fixed inset-0 z-30 mx-auto flex max-w-[480px] flex-col justify-center overflow-y-auto bg-white px-5 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <motion.div
            className="dots mx-auto w-full max-w-[320px] -rotate-2 rounded-[26px] border-2 border-ink px-5 pt-8 pb-6 text-center shadow-[5px_5px_0_var(--color-ink)]"
            initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -2, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            <div className="flex justify-center">
              {[CURRENT_USER.photoUrl, match.profile.photoUrl].map((src, i) => (
                <motion.div
                  key={src}
                  className={`relative h-24 w-24 overflow-hidden rounded-full border-2 border-ink bg-white ${i === 1 ? "-ml-4" : ""}`}
                  initial={{ x: i === 0 ? -40 : 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1, rotate: i === 0 ? -6 : 6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.12 }}
                >
                  <Image src={src} alt={i === 0 ? "You" : match.profile.name} fill sizes="96px" unoptimized className="object-cover" />
                </motion.div>
              ))}
            </div>
            <motion.span
              className="mt-4 inline-block rounded-full border-2 border-ink bg-pink px-3 py-0.5 text-[0.875rem] font-extrabold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.3 }}
            >
              Matched
            </motion.span>
          </motion.div>

          <h2 id="match-title" className="mt-10 text-center text-[2rem] leading-tight font-extrabold tracking-[-0.03em]">
            It&apos;s a match!
          </h2>
          <p className="mt-2 text-center text-muted">You and {match.profile.name} liked each other.</p>

          <div className="mt-8 flex flex-col gap-3">
            <Link href="/discover/matches" className="btn w-full">
              View matches
            </Link>
            <button type="button" onClick={onClose} autoFocus className="btn quiet w-full">
              Keep swiping
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
