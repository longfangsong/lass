import { millisecondsInHour } from "date-fns/constants";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { progress, type Progress } from "../atoms/sync";
import { progress as initProgress } from "../atoms/init";
import { sync } from "../../application/sync";
import { repository } from "../../infrastructure/repository";
import { useAuth } from "@/app/shared/presentation/hooks/useAuth";

const autoSyncInterval = millisecondsInHour;
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

export function useSyncDictionary() {
  const inited = useAtomValue(initProgress);
  const [currentProgress, setProgress] = useAtom(progress);
  const { user } = useAuth();
  useEffect(() => {
    if (inited !== "Done") {
      setProgress("Initing");
    } else if (user && timer === null) {
      setProgress("NeedCheck");
      timer = startSyncInterval(currentProgress, setProgress);
    } else if (!user && timer !== null) {
      setProgress("NeedCheck");
      clearInterval(timer!);
    }
  }, [inited, currentProgress, setProgress, user]);
  return () => {
    if (timer !== null) {
      clearInterval(timer);
    }
    timer = startSyncInterval(currentProgress, setProgress);
    sync(repository, setProgress);
  };
}
