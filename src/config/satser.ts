import type { RateBp } from '../domain/money'

/** Skattefradrag for gjeldsrenter (alminnelig inntekt), per inntektsår. 22 % = 2200. */
export const INTEREST_DEDUCTION: Record<number, RateBp> = {
  2026: 2200,
}
