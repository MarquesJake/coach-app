export function prepareNetworkFormData(formData: FormData) {
  // The legacy relationship action treats an absent checkbox as true.
  formData.set('first_hand', formData.get('first_hand') === 'true' ? 'true' : 'false')
  for (const field of ['next_follow_up_at', 'next_review_at', 'scheduled_at']) {
    const value = formData.get(field)
    if (typeof value === 'string' && value.trim()) {
      const date = new Date(value)
      if (!Number.isFinite(date.getTime())) throw new Error('Choose a valid date and time.')
      formData.set(field, date.toISOString())
    }
  }
  if (formData.has('campaign_id') && !String(formData.get('contact_id') ?? '').trim() && !String(formData.get('prospect_name') ?? '').trim()) {
    throw new Error('Select a network contact or enter a prospect name.')
  }
  return formData
}
