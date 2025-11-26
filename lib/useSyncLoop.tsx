import { useEffect } from "react";
import { syncPendingOps } from "@/lib/sync";

export function useSyncLoop() {
  useEffect(() => {
    syncPendingOps();

    const onOnline = () => syncPendingOps();
    window.addEventListener("online", onOnline);

    // periodic sync
    const interval = setInterval(() => {
      syncPendingOps();
    }, 30_000);

    return () => {
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
  }, []);
}
