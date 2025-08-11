import { atom, type Atom } from "jotai";
import { progress as dictionaryProgress } from "./dictionary/sync";
import { progress as wordbookProgress } from "./wordbook/sync";

export type Progress = "NeedCheck" | "Initing" | "InProgress" | "Done";

export const progress: Atom<Progress> = atom((get) => {
  const dictionary = get(dictionaryProgress);
  const wordbook = get(wordbookProgress);
  if (dictionary === "Initing") {
    return "Initing";
  } else if (dictionary === "NeedCheck" || wordbook === "NeedCheck") {
    return "NeedCheck";
  } else if (dictionary === "InProgress" || wordbook === "InProgress") {
    return "InProgress";
  } else {
    return "Done";
  }
});
