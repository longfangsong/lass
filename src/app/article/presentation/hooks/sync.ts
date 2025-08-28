import { useAtom } from "jotai";
import { useEffect } from "react";
import { hoursToMilliseconds } from "date-fns";
import { sync, type Progress } from "../../application/sync";
import { repository } from "../../infrastructure/repository";
import { progress } from "../atoms/sync";
import { useAuth } from "@/app/shared/presentation/hooks/useAuth";

const autoSyncInterval = hoursToMilliseconds(1);
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

export function useSyncArticle() {
  const [currentProgress, setProgress] = useAtom(progress);
  const { user } = useAuth();
  useEffect(() => {
    if (timer === null) {
      timer = startSyncInterval(currentProgress, setProgress);
    } else {
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
