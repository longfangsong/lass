import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { progress, tasks } from "../atoms/init";
import { initIfNeeded } from "../../application/init";

export function useInitDictionaryIfNeeded() {
  const setTasks = useSetAtom(tasks);
  const [progressValue, setProgress] = useAtom(progress);
  useEffect(() => {
    initIfNeeded(setTasks, setProgress);
  }, [setTasks, setProgress]);
  return progressValue === "Done";
}
