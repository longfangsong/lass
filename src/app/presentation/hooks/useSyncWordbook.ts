import { useSetAtom } from "jotai";
import { progress } from "../atoms/dictionary/sync";
import { useEffect } from "react";
import { sync } from "@/app/application/usecase/wordbook/sync";
import { minutesToMilliseconds } from "date-fns";
import { useAuth } from "./useAuth";

export function useSyncWordbookInterval() {
  const user = useAuth();
  const setProgress = useSetAtom(progress);
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        sync(setProgress);
      }, minutesToMilliseconds(1));
      return () => clearInterval(interval);
    }
  }, [setProgress, user]);
}
