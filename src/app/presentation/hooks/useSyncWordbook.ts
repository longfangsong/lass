import { useAtom } from "jotai";
import { progress } from "../atoms/wordbook/sync";
import { useEffect } from "react";
import { sync } from "@/app/application/service/wordbook/sync";
import { minutesToMilliseconds } from "date-fns";
import { useAuth } from "./useAuth";

export function useSyncWordbookInterval() {
  const { user } = useAuth();
  const [currentProgress, setProgress] = useAtom(progress);
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        if (currentProgress !== "InProgress") {
          sync(setProgress);
        }
      }, minutesToMilliseconds(1));
      return () => clearInterval(interval);
    }
  }, [currentProgress, setProgress, user]);
}
