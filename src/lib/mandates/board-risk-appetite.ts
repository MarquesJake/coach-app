export type BoardRiskAppetite = 'Conservative' | 'Moderate' | 'Aggressive'

// The UI's explicit unknown option is stored as SQL NULL, never a guessed preference.
export function parseBoardRiskAppetite(input: FormDataEntryValue | null):
  | { ok: true; value: BoardRiskAppetite | null }
  | { ok: false; error: string } {
  const value = typeof input === 'string' ? input.trim() : input
  if (value === null || value === '' || value === 'Not yet agreed') {
    return { ok: true, value: null }
  }
  if (value === 'Conservative' || value === 'Moderate' || value === 'Aggressive') {
    return { ok: true, value }
  }
  return { ok: false, error: 'Choose a valid board risk appetite or Not yet agreed.' }
}
