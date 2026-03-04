/** Exact string user must type to enable Clear my data. */
export const CLEAR_CONFIRM_TEXT = 'CLEAR'

/** Check if form confirmation matches required text (case-sensitive). */
export function validateClearConfirmation(input: string | null | undefined): boolean {
  return input?.trim() === CLEAR_CONFIRM_TEXT
}
