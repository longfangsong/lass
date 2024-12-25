import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    import("./localFirst").then(({ localFirstDataSource }) => {
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
    import("./localFirst").then(({ localFirstDataSource }) => {
      localFirstDataSource.on("dictionary-sync-started", () =>
        setSyncState(SyncState.Syncing),
      );
      localFirstDataSource.on("dictionary-sync-finished", () =>
        setSyncState(SyncState.Synced),
      );
    });
  }, []);
  return syncState;
}
