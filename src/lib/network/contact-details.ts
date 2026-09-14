/** Editable contact details only. Attribution, ownership and restriction fields are deliberately absent. */
export function readContactDetails(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? '').trim()
  const optional = (key: string) => text(key) || null
  const fullName = text('full_name')
  if (!fullName) throw new Error('Contact name is required.')
  const stakeholderGroup = text('stakeholder_group') || 'other'
  if (!['owners_ceos', 'sporting_leadership', 'coaching_staff', 'players', 'industry_network', 'journalists', 'agents', 'other'].includes(stakeholderGroup)) throw new Error('Unknown stakeholder group.')
  const email = optional('email')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const reliability = optional('reliability_score')
  const reliabilityScore = reliability === null ? null : Number(reliability)
  if (reliabilityScore !== null && (!Number.isInteger(reliabilityScore) || reliabilityScore < 0 || reliabilityScore > 100)) throw new Error('Reliability must be a whole number from 0 to 100.')
  const followUp = optional('next_follow_up_at')
  if (followUp && (!/(Z|[+-]\d{2}:\d{2})$/.test(followUp) || !Number.isFinite(Date.parse(followUp)))) throw new Error('Choose a valid follow-up date and time.')
  return {
    full_name: fullName,
    current_role_title: optional('current_role'),
    current_organization: optional('current_organization'),
    email,
    phone: optional('phone'),
    stakeholder_group: stakeholderGroup,
    expertise: text('expertise').split(',').map(value => value.trim()).filter(Boolean),
    reliability_score: reliabilityScore,
    next_follow_up_at: followUp ? new Date(followUp).toISOString() : null,
    follow_up_note: optional('follow_up_note'),
  }
}

export function emailLookupPattern(email: string) {
  return email.replace(/[\\%_]/g, character => '\\' + character)
}
