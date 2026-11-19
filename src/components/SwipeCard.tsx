"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, useTransform, type PanInfo, type Variants } from "framer-motion";
import type { PublicProfile, SwipeAction } from "@/lib/types";

interface Props {
  profile: PublicProfile;
  /** 0 is the card on top; 1 and 2 sit behind it (2 is hidden and only there to preload the photo). */
  depth: number;
  onDecide: (action: SwipeAction) => void;
}

const DISTANCE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

const variants: Variants = {
  stack: (depth: number) => ({
    scale: 1 - depth * 0.04,
    y: depth * 22,
    opacity: depth > 1 ? 0 : 1,
    transition: { type: "spring", stiffness: 380, damping: 32 },
  }),
  // AnimatePresence passes the swipe direction (1 = like, -1 = pass) as `custom`.
  exit: (direction: number) => ({
    x: direction * (window.innerWidth + 240),
    opacity: 0.6,
    transition: { type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.32 },
  }),
};

export function SwipeCard({ profile, depth, onDecide }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);
  const likeOpacity = useTransform(x, [16, DISTANCE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-DISTANCE_THRESHOLD, -16], [1, 0]);
  const isTop = depth === 0;

  const handleDragEnd = (_: unknown, { offset, velocity }: PanInfo) => {
    if (offset.x > DISTANCE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) onDecide("like");
    else if (offset.x < -DISTANCE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) onDecide("pass");
    else animate(x, 0, { type: "spring", stiffness: 520, damping: 34 });
  };

  return (
    <motion.article
      className={`absolute inset-0 flex touch-none flex-col overflow-hidden rounded-[26px] border-2 border-ink bg-white select-none ${
        isTop ? "cursor-grab shadow-[5px_5px_0_var(--color-ink)] active:cursor-grabbing" : "pointer-events-none"
      }`}
      style={{ x, rotate, zIndex: 10 - depth }}
      custom={depth}
      variants={variants}
      initial={{ scale: 0.9, y: 28, opacity: 0 }}
      animate="stack"
      exit="exit"
      drag={isTop ? "x" : false}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      aria-hidden={!isTop}
      aria-label={isTop ? `${profile.name}, ${profile.age}` : undefined}
    >
      <div className="dots relative flex min-h-[6.5rem] flex-1 items-center justify-center border-b-2 border-ink short:min-h-[5rem]">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-ink bg-white shadow-[3px_3px_0_var(--color-ink)] short:h-16 short:w-16 tall:h-40 tall:w-40">
          <Image
            src={profile.photoUrl}
            alt=""
            fill
            sizes="160px"
            unoptimized
            draggable={false}
            className="pointer-events-none object-cover"
          />
        </div>

        <motion.span
          style={{ opacity: likeOpacity }}
          className="absolute top-5 left-5 -rotate-12 rounded-xl border-2 border-ink bg-pink px-3 py-1 text-2xl font-extrabold tracking-wide shadow-[3px_3px_0_var(--color-ink)] short:top-3 short:text-xl"
        >
          LIKE
        </motion.span>
        <motion.span
          style={{ opacity: nopeOpacity }}
          className="absolute top-5 right-5 rotate-12 rounded-xl border-2 border-ink bg-white px-3 py-1 text-2xl font-extrabold tracking-wide shadow-[3px_3px_0_var(--color-ink)] short:top-3 short:text-xl"
        >
          NOPE
        </motion.span>
      </div>

      <div className="px-5 pt-4 pb-5 short:pt-3 short:pb-4">
        <h2 className="text-[1.75rem] leading-tight font-extrabold tracking-[-0.02em]">
          {profile.name}, <span className="font-semibold text-muted">{profile.age}</span>
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-[0.875rem] font-semibold text-muted">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span className="truncate">{profile.location}</span>
        </p>
        <p className="mt-3 text-[1rem] leading-snug">{profile.bio}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {profile.interests.map((interest) => (
            <li key={interest} className="rounded-full bg-soft px-3 py-1 text-[0.8125rem] font-bold">
              {interest}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
