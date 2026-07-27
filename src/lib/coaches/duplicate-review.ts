export type DuplicateReviewCoach = {
  id: string
  name: string
  club_current?: string | null
  nationality?: string | null
}

export type CoachDuplicateGroup<T extends DuplicateReviewCoach> = {
  id: string
  reason: string
  coaches: T[]
}

function normalise(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function nameParts(name: string) {
  const parts = normalise(name).split(' ').filter(Boolean)
  return {
    full: parts.join(' '),
    firstInitial: parts[0]?.[0] ?? '',
    surname: parts.at(-1) ?? '',
  }
}

function duplicateReason(a: DuplicateReviewCoach, b: DuplicateReviewCoach) {
  const aName = nameParts(a.name)
  const bName = nameParts(b.name)
  if (aName.full && aName.full === bName.full) return 'Same normalised name'

  const aClub = normalise(a.club_current)
  const bClub = normalise(b.club_current)
  if (
    aClub &&
    aClub === bClub &&
    aName.surname &&
    aName.surname === bName.surname &&
    aName.firstInitial &&
    aName.firstInitial === bName.firstInitial
  ) {
    return 'Matching initial, surname and current club'
  }
  return null
}

export function findCoachDuplicateGroups<T extends DuplicateReviewCoach>(
  coaches: T[]
): CoachDuplicateGroup<T>[] {
  const parent = new Map(coaches.map((coach) => [coach.id, coach.id]))
  const reasons = new Map<string, string>()

  function root(id: string): string {
    const current = parent.get(id) ?? id
    if (current === id) return id
    const resolved = root(current)
    parent.set(id, resolved)
    return resolved
  }

  function union(a: string, b: string, reason: string) {
    const aRoot = root(a)
    const bRoot = root(b)
    if (aRoot === bRoot) return
    parent.set(bRoot, aRoot)
    reasons.set(aRoot, reasons.get(aRoot) ?? reasons.get(bRoot) ?? reason)
  }

  for (let i = 0; i < coaches.length; i += 1) {
    for (let j = i + 1; j < coaches.length; j += 1) {
      const reason = duplicateReason(coaches[i], coaches[j])
      if (reason) union(coaches[i].id, coaches[j].id, reason)
    }
  }

  const grouped = new Map<string, T[]>()
  for (const coach of coaches) {
    const groupRoot = root(coach.id)
    const current = grouped.get(groupRoot) ?? []
    current.push(coach)
    grouped.set(groupRoot, current)
  }

  return Array.from(grouped.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([groupRoot, rows]) => ({
      id: groupRoot,
      reason: reasons.get(groupRoot) ?? 'Potential duplicate records',
      coaches: rows.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.coaches[0].name.localeCompare(b.coaches[0].name))
}
