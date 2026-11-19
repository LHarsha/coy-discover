"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useImperativeHandle, useRef, type Ref } from "react";
import type { PublicProfile, SwipeAction } from "@/lib/types";

export interface SwipeCardHandle {
  swipe: (action: SwipeAction) => void;
}

interface Props {
  profile: PublicProfile;
  isTop: boolean;
  onSwiped: (action: SwipeAction) => void;
  ref?: Ref<SwipeCardHandle>;
}

const DISTANCE_THRESHOLD = 110;
const VELOCITY_THRESHOLD = 600;

export function SwipeCard({ profile, isTop, onSwiped, ref }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, DISTANCE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-DISTANCE_THRESHOLD, -20], [1, 0]);
  const leaving = useRef(false);

  const flyOut = (action: SwipeAction, velocity = 0) => {
    if (leaving.current) return;
    leaving.current = true;
    const target = (action === "like" ? 1 : -1) * (window.innerWidth + 200);
    animate(x, target, {
      type: "tween",
      ease: "easeOut",
      duration: Math.max(0.2, 0.35 - Math.abs(velocity) / 10000),
      onComplete: () => onSwiped(action),
    });
  };

  useImperativeHandle(ref, () => ({ swipe: (action) => flyOut(action) }));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > DISTANCE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) flyOut("like", velocity.x);
    else if (offset.x < -DISTANCE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) flyOut("pass", velocity.x);
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  return (
    <motion.article
      className="absolute inset-0 touch-none overflow-hidden rounded-3xl bg-neutral-200 shadow-xl select-none"
      style={{ x, rotate, zIndex: isTop ? 2 : 1 }}
      initial={false}
      animate={{ scale: isTop ? 1 : 0.94, y: isTop ? 0 : 14 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      drag={isTop ? "x" : false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      aria-hidden={!isTop}
      aria-label={isTop ? `${profile.name}, ${profile.age}` : undefined}
    >
      <Image
        src={profile.photoUrl}
        alt=""
        fill
        sizes="(max-width: 448px) 100vw, 448px"
        className="pointer-events-none object-cover"
        draggable={false}
        priority={isTop}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pt-24 pb-5 text-white">
        <h2 className="text-3xl font-bold">
          {profile.name}, <span className="font-normal">{profile.age}</span>
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          {profile.location}
        </p>
        <p className="mt-3 text-[15px] leading-snug">{profile.bio}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {profile.interests.map((interest) => (
            <li key={interest} className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              {interest}
            </li>
          ))}
        </ul>
      </div>

      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-6 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-3xl font-extrabold tracking-wider text-emerald-400"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-6 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-3xl font-extrabold tracking-wider text-rose-500"
      >
        NOPE
      </motion.div>
    </motion.article>
  );
}
