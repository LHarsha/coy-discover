import { DiscoverHeader } from "@/components/DiscoverHeader";

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DiscoverHeader />
      {children}
    </div>
  );
}
