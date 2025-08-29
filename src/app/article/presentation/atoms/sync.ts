import { atom } from "jotai";
import type { Progress } from "../../application/sync";

export const progress = atom<Progress>("NeedCheck");
