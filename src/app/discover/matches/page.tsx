import Image from "next/image";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getMatches } from "@/lib/discover";
import { CURRENT_USER_ID } from "@/lib/me";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

export default async function MatchesPage() {
  const matches = await getMatches(await getDb(), CURRENT_USER_ID);

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <h2 className="text-xl font-bold">No matches yet</h2>
        <p className="text-black/55">
          When you and someone both like each other, they&apos;ll show up here. Nobody sees your likes unless
          it&apos;s mutual.
        </p>
        <Link href="/discover" className="mt-2 rounded-full bg-brand px-6 py-2.5 font-semibold text-white">
          Start swiping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      <p className="mb-3 text-sm text-black/50">
        {matches.length} mutual {matches.length === 1 ? "match" : "matches"}
      </p>
      <ul className="grid grid-cols-2 gap-3">
        {matches.map(({ profile, matchedAt }) => (
          <li key={profile.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200 shadow-sm">
            <Image src={profile.photoUrl} alt="" fill sizes="(max-width: 448px) 50vw, 224px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white">
              <p className="font-semibold">
                {profile.name}, {profile.age}
              </p>
              <p className="truncate text-xs text-white/75">{profile.location}</p>
              <p className="mt-0.5 text-[11px] text-white/60">Matched {dateFormat.format(new Date(matchedAt))}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
