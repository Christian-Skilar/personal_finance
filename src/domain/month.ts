/** Måned som "ÅÅÅÅ-MM". */
export type YearMonth = string
/** Dato som "ÅÅÅÅ-MM-DD". */
export type IsoDate = string

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

function split(ym: YearMonth): [number, number] {
  const [y, m] = ym.split('-').map(Number)
  return [y, m]
}

export function toYearMonth(date: IsoDate): YearMonth {
  return date.slice(0, 7)
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const [y, m] = split(ym)
  const idx = y * 12 + (m - 1) + n
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`
}

export function monthsBetween(from: YearMonth, to: YearMonth): number {
  const [fy, fm] = split(from)
  const [ty, tm] = split(to)
  return (ty - fy) * 12 + (tm - fm)
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function dueDate(ym: YearMonth, dueDay: number): IsoDate {
  const [y, m] = split(ym)
  return `${ym}-${pad(Math.min(dueDay, daysInMonth(y, m)))}`
}

const monthShort = new Intl.DateTimeFormat('nb-NO', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const monthLong = new Intl.DateTimeFormat('nb-NO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const dateFormat = new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

function utc(ym: YearMonth, day = 1): Date {
  const [y, m] = split(ym)
  return new Date(Date.UTC(y, m - 1, day))
}

export function formatMonthShort(ym: YearMonth): string {
  return monthShort.format(utc(ym))
}

export function formatMonthLong(ym: YearMonth): string {
  return monthLong.format(utc(ym))
}

export function formatDate(d: IsoDate): string {
  return dateFormat.format(utc(toYearMonth(d), Number(d.slice(8, 10))))
}

export function todayIso(): IsoDate {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
