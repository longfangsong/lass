import { useSetAtom } from "jotai";
import { progress } from "../atoms/sync";
import { sync } from "../../application/sync";
import { repository } from "../../infrastructure/repository";

/**
 * Provides a function to trigger a wordbook sync.
 * This is intended to be used for event-driven syncs, like on component unmount.
 * The continuous background sync is handled by the SyncManager component.
 */
export function useSyncWordbook() {
  const setProgress = useSetAtom(progress);

  return () => {
    // Trigger a sync without affecting the global timer.
    sync(repository, setProgress);
  };
}
