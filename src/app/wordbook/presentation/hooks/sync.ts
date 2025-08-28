import { useAtom } from "jotai";
import { useEffect } from "react";
import { millisecondsInMinute } from "date-fns/constants";
import { progress, type Progress } from "../atoms/sync";
import { useAuth } from "@/app/shared/presentation/hooks/useAuth";
import { sync } from "../../application/sync";
import { repository } from "../../infrastructure/repository";

const autoSyncInterval = millisecondsInMinute;
let timer: ReturnType<typeof setInterval> | null = null;

function startSyncInterval(
  currentProgress: Progress,
  setProgress: (args_0: Progress | ((prev: Progress) => Progress)) => void,
): ReturnType<typeof setInterval> | null {
  repository.version.then((version) => {
    const now = Date.now();
    if (now - (version || 0) > autoSyncInterval) {
      if (currentProgress !== "InProgress") {
        sync(repository, setProgress);
      }
    }
  });
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
