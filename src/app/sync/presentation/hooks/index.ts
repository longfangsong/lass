import { useSetAtom } from "jotai";
import { SyncService } from "../../domain/service/sync";
import { syncState } from "../atoms";
import { useEffect } from "react";
import type { SyncState } from "../../domain/types";
import { articleTable, lexemeTable, metaTable, settingsTable, wordBookEntryTable, wordIndexTable, wordTable } from "../../infrastructure/tables";
import { HttpApiClient } from "../../infrastructure/http-api-client";
import { logger } from "@/utils";

const syncService = new SyncService(
  metaTable,
  [articleTable, wordTable, wordIndexTable, lexemeTable, wordBookEntryTable, settingsTable],
  new HttpApiClient()
);

export function useRegisterSyncService() {
  const setSyncState = useSetAtom(syncState);

  useEffect(() => {
    // Set up event listener for state changes
    const handleStateChange = (event: CustomEvent<SyncState>) => {
      setSyncState(event.detail);
    };

    // Set initial state
    logger.state("SyncService initial state:", syncService.state);
    setSyncState(syncService.state);

    syncService.addEventListener("progress", handleStateChange as EventListener);

    // Cleanup function
    return () => {
      syncService.removeEventListener("progress", handleStateChange as EventListener);
    };
  }, [setSyncState]);
}

export function useSyncService() {
  return syncService;
}
