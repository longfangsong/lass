import { useAtom } from "jotai";
import { useEffect } from "react";
import { sync } from "@/app/application/service/wordbook/sync";
import { repository } from "@/app/infrastructure/indexeddb/wordbookEntryRepository";
import { millisecondsInMinute } from "date-fns/constants";
import { useAuth } from "../useAuth";
import { progress, type Progress } from "../../atoms/wordbook/sync";

const autoSyncInterval = millisecondsInMinute;
let timer: ReturnType<typeof setInterval> | null = null;

function startSyncInterval(
  currentProgress: Progress,
  setProgress: (args_0: Progress | ((prev: Progress) => Progress)) => void,
): ReturnType<typeof setInterval> | null {
  return setInterval(() => {
    if (currentProgress !== "InProgress") {
      sync(repository, setProgress);
    }
  }, autoSyncInterval);
}

export function useSyncWordbook() {
  const [currentProgress, setProgress] = useAtom(progress);
  const { user } = useAuth();
  useEffect(() => {
    if (user && timer === null) {
      timer = startSyncInterval(currentProgress, setProgress);
    } else if (!user && timer !== null) {
      clearInterval(timer!);
    }
  }, [currentProgress, setProgress, user]);
  return () => {
    if (timer !== null) {
      clearInterval(timer);
    }
    timer = startSyncInterval(currentProgress, setProgress);
    sync(repository, setProgress);
  };
}
