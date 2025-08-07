import { initIfNeeded } from "@app/application/usecase/dictionary/init";
import { tasks, progress } from "@app/presentation/atoms/dictionary/init";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

export function useInitDictionaryIfNeeded() {
  const setTasks = useSetAtom(tasks);
  const [progressValue, setProgress] = useAtom(progress);
  useEffect(() => {
    initIfNeeded(setTasks, setProgress);
  }, [setTasks, setProgress]);
  return progressValue === "Done";
}
