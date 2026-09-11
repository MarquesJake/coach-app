const fields = ['current_salary', 'salary_expectation', 'release_compensation', 'availability_timeline',
  'family_situation', 'relocation_requirements', 'staff_cost_expectation', 'appointment_conditions'] as const

/** Partial submissions must not erase fields that were never rendered or sent. */
export function circumstancesTextPatch(form: FormData) {
  const patch: Partial<Record<typeof fields[number], string | null>> = {}
  for (const field of fields) {
    if (form.has(field)) {
      const value = form.get(field)
      if (typeof value !== 'string') throw new Error('Circumstances fields must be text')
      patch[field] = value.trim() || null
    }
  }
  return patch
}
