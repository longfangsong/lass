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
