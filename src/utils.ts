export function assert(
  condition: boolean,
  message: string = "Assertion failed",
) {
  if (!condition) {
    console.error(message);
    throw new Error(message);
  }
}
