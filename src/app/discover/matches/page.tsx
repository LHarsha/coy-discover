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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="dots grid h-20 w-20 place-items-center rounded-full border-2 border-ink">
          <span className="h-4 w-4 rounded-full bg-pink" />
        </div>
        <h2 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">No matches yet</h2>
        <p className="text-muted">
          When you and someone both like each other, they show up here. Nobody sees your likes unless it&apos;s mutual.
        </p>
        <Link href="/discover" className="btn">
          Start swiping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
      <h2 className="mb-3 text-[1.1875rem] font-bold">
        Your matches <span className="text-muted">{matches.length}</span>
      </h2>
      <ul className="grid gap-2.5">
        {matches.map(({ profile, matchedAt }) => (
          <li key={profile.id} className="flex items-center gap-3.5 rounded-[18px] bg-pink-soft py-3 pr-4 pl-3.5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-white">
              <Image src={profile.photoUrl} alt="" fill sizes="48px" unoptimized className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {profile.name}, {profile.age}
              </p>
              <p className="truncate text-[0.875rem] text-muted">{profile.location}</p>
            </div>
            <span className="shrink-0 rounded-full border-2 border-ink bg-pink px-2.5 py-0.5 text-[0.75rem] font-extrabold">
              {dateFormat.format(new Date(matchedAt))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
