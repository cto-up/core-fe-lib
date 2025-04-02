export function createGreeting(name?: string): string {
    return name === undefined ? "Hello!" : `Hello ${name}!`
  }