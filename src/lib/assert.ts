export function assert(condition: boolean, message?: string) {
  if (message === undefined) {
    message = "Assertion failed";
  }
  if (!condition) {
    console.error(message);
  }
}
