import { atom } from "jotai";

export interface Tasks {
  version: number;
  tables: Array<[string, number]>;
}
export const tasks = atom<Tasks | undefined>(undefined);
export type Progress = "NeedCheck" | Array<[string, number]> | "Done";
export const progress = atom<Progress>("NeedCheck");
