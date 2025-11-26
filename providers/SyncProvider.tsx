"use client";

import { useSyncLoop } from "@/lib/useSyncLoop";

export default function SyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSyncLoop();

  return <>{children}</>;
}
