import { atom } from "jotai";

export type Progress = "NeedCheck" | "InProgress" | { last_check: number };
export const progress = atom<Progress>("NeedCheck");

export function isChecked(progress: Progress): boolean {
  return progress !== "NeedCheck" && progress !== "InProgress";
}
