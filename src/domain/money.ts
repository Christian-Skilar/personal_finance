/** Beløp i hele øre (heltall). 1 kr = 100 øre. */
export type Ore = number
/** Rente i hundredels prosent (heltall). 5,20 % = 520. */
export type RateBp = number

/**
 * Tolker et tall med inntil to desimaler til hundredeler (øre eller hundredels prosent).
 * Godtar mellomrom (også hardt) som tusenskille og komma eller punktum som desimaltegn.
 */
function parseHundredths(input: string): number | null {
  const s = input.replace(/[\s  ]/g, '')
  const m = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(s)
  if (!m) return null
  const whole = Number(m[1])
  const frac = Number((m[2] ?? '').padEnd(2, '0'))
  return whole * 100 + frac
}

export function parseNok(input: string): Ore | null {
  return parseHundredths(input.replace(/kr\.?/i, ''))
}

const nokFormat = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' })
const nokWholeFormat = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatNok(ore: Ore, opts?: { whole?: boolean }): string {
  return opts?.whole ? nokWholeFormat.format(Math.round(ore / 100)) : nokFormat.format(ore / 100)
}

export function parseRate(input: string): RateBp | null {
  const rate = parseHundredths(input.replace('%', ''))
  if (rate === null || rate > 10000) return null
  return rate
}

const rateFormat = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatRate(rate: RateBp): string {
  return `${rateFormat.format(rate / 100)} %`
}
