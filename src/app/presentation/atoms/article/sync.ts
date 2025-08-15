import type { Progress } from "@/app/application/service/article/sync";
import { atom } from "jotai";

export const progress = atom<Progress>("NeedCheck");
