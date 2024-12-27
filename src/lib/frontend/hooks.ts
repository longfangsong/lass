import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    import("./datasource/localFirst").then(({ localFirstDataSource }) => {
      localFirstDataSource.online.then(setOnline);
      localFirstDataSource.on("online-changed", setOnline);
    });
  }, []);

  return online;
}

export enum SyncState {
  NotSynced,
  Syncing,
  Synced,
}

export function useDictionarySyncState() {
  const [syncState, setSyncState] = useState(SyncState.NotSynced);
  useEffect(() => {
    import("./datasource/localFirst").then(({ localFirstDataSource }) => {
      localFirstDataSource.on("dictionary-sync-started", () =>
        setSyncState(SyncState.Syncing),
      );
      localFirstDataSource.on("dictionary-sync-finished", (syncSuccess) =>
        setSyncState(syncSuccess ? SyncState.Synced : SyncState.NotSynced),
      );
    });
  }, []);
  return syncState;
}

export function useReviewProgressSyncState() {
  const [syncState, setSyncState] = useState(SyncState.NotSynced);
  useEffect(() => {
    import("./datasource/localFirst").then(({ localFirstDataSource }) => {
      localFirstDataSource.on("review-progress-sync-started", () =>
        setSyncState(SyncState.Syncing),
      );
      localFirstDataSource.on("review-progress-sync-finished", (syncSuccess) =>
        setSyncState(syncSuccess ? SyncState.Synced : SyncState.NotSynced),
      );
    });
  }, []);
  return syncState;
}