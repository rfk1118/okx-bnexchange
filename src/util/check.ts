export function check(condition: any, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
