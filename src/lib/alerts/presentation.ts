export function alertDestination(entityType: string, id: string): { href: string; label: string } | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  switch (entityType) {
    case 'coach': return { href: `/coaches/${id}`, label: 'Open coach profile' }
    case 'mandate': return { href: `/mandates/${id}/decision`, label: 'Open appointment' }
    case 'club': return { href: `/clubs/${id}`, label: 'Open club' }
    case 'agent': return { href: `/agents/${id}`, label: 'Open agent' }
    case 'staff': return { href: `/staff/${id}`, label: 'Open staff profile' }
    default: return null
  }
}
