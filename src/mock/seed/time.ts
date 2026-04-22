const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString()
}

export function hoursAgo(n: number): string {
  return new Date(Date.now() - n * HOUR).toISOString()
}

export function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString()
}

export function daysFromNow(n: number): string {
  return new Date(Date.now() + n * DAY).toISOString()
}
