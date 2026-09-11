type ClubOptionRow = {
  id: string
  name: string
  league: string
}

const nonProductionMarker = /\b(?:demo|qa|rehearsal|test|workflow)\b/i

export function buildClubOptions(rows: ClubOptionRow[], preferredId?: string) {
  const names = new Set<string>()
  const preferred = rows.find((club) => club.id === preferredId)
  return rows.flatMap((row) => {
    const club = preferred && row.name.trim().toLocaleLowerCase('en-GB') === preferred.name.trim().toLocaleLowerCase('en-GB') ? preferred : row
    if (nonProductionMarker.test(`${club.name} ${club.league}`)) return []
    const key = club.name.trim().toLocaleLowerCase('en-GB')
    if (names.has(key)) return []
    names.add(key)
    return [{ id: club.id, label: `${club.name} (${club.league})` }]
  })
}
