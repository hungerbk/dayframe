export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  // 3~9로 시작하면 두 자리 시가 될 수 없으므로(30~99시 불가) 앞에 0 패딩
  if (parseInt(digits[0], 10) > 2) {
    return `0${digits[0]}:${digits.slice(1, 3)}`
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

// "12:5" 처럼 3자리만 입력된 채 포커스를 벗어날 때 H:MM으로 재해석해 시 앞에 0 패딩
// "125" → "12:5" → blur → "01:25"
export function padTimeOnBlur(value: string): string {
  if (/^\d{2}:\d$/.test(value)) {
    const digits = value.replace(/\D/g, "")
    return `0${digits[0]}:${digits.slice(1)}`
  }
  return value
}

export function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false
  const [h, m] = time.split(':').map(Number)
  if (h === 24) return m === 0
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

// 자정을 넘는 블록(예: 22:00~07:00)을 허용하기 위해 start !== end 조건만 검사한다.
export function isEndAfterStart(start: string, end: string): boolean {
  return start !== end
}
