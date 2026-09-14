import records from './current-employment.json' with { type: 'json' }

export type CurrentEmployment = {
  apiId: number
  name: string
  club: string | null
  role: string | null
  status: 'employed' | 'unattached' | 'unknown'
  checkedAt: string
  sourceUrl: string | null
  sourceTitle: string | null
  note: string
}

/** Reviewed employment is separate from historical tactical coding and deal feasibility. */
export function currentEmploymentForApiId(apiId: number): CurrentEmployment | undefined {
  return (records as CurrentEmployment[]).find(record => record.apiId === apiId)
}

export function employmentLabel(record: CurrentEmployment): string {
  if (record.status === 'unknown') return 'Current employment not verified'
  if (record.status === 'unattached') return 'No current appointment verified by the cited source'
  return [record.role, record.club].filter(Boolean).join(' · ')
}
