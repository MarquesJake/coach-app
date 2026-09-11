export type StaffDetails = { full_name: string; primary_role?: string | null; notes?: string | null }

export function staffDetails(input: StaffDetails) {
  if (typeof input.full_name !== 'string' || !input.full_name.trim()) throw new Error('Full name is required')
  return { full_name: input.full_name.trim(), primary_role: input.primary_role?.trim() || null, notes: input.notes?.trim() || null }
}

export function countLinkedCoaches(rows: { coach_id: string }[]) {
  return new Set(rows.map((row) => row.coach_id)).size
}
