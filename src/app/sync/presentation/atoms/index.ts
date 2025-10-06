import { atom } from "jotai";
import type { SyncState } from "../../domain/types";

// Atom to track the current sync state
export const syncState = atom<SyncState>("unknown");
