export function assert(
  condition: boolean,
  message: string = "Assertion failed",
): asserts condition {
  if (!condition) {
    console.error(message);
    throw new Error(message);
  }
}

export function debugAssert(
  condition: boolean,
  message: string = "Assertion failed",
): asserts condition {
  if (import.meta.env.DEV && !condition) {
    console.error(message);
    throw new Error(message);
  }
}

/**
 * Throttle utility function based on Remeda documentation.
 * Limits the rate at which a function can fire.
 */
export function throttle<F extends (...args: never[]) => void>(
  func: F,
  wait = 0,
  {
    leading = true,
    trailing = true,
  }: { readonly leading?: boolean; readonly trailing?: boolean } = {},
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<F> | null = null;

  const execute = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastExecTime = Date.now();
      lastArgs = null;
    }
  };

  return (...args: Parameters<F>) => {
    const now = Date.now();
    const timeSinceLastExec = now - lastExecTime;

    lastArgs = args;

    if (timeSinceLastExec >= wait) {
      if (leading) {
        execute();
        return;
      }
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (trailing) {
        execute();
      }
      timeoutId = null;
    }, wait - timeSinceLastExec);
  };
}
