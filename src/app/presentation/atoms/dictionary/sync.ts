import { atom } from "jotai";

export type Progress = "NeedCheck" | "InProgress" | { last_check: number };
export const progress = atom<Progress>("NeedCheck");
