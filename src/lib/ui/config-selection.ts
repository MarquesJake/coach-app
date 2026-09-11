export function configSelection(index: number, filteredCount: number, showAddOptions: boolean, freeTextOnly: boolean):
  { kind: 'add' | 'text' } | { kind: 'option'; index: number } | null {
  const offset = showAddOptions ? freeTextOnly ? 1 : 2 : 0
  if (showAddOptions && index === 0) return { kind: freeTextOnly ? 'text' : 'add' }
  if (showAddOptions && !freeTextOnly && index === 1) return { kind: 'text' }
  const optionIndex = index - offset
  return optionIndex >= 0 && optionIndex < filteredCount ? { kind: 'option', index: optionIndex } : null
}
