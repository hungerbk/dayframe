export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false
  const [h, m] = time.split(':').map(Number)
  if (h === 24) return m === 0
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

export function isEndAfterStart(start: string, end: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  return toMinutes(end) > toMinutes(start)
}
