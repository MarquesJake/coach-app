export type DeepResearchPoint = {
  text: string
  sourceUrls: string[]
  period: string
}

export type DeepResearchSection = {
  key: 'career' | 'in-possession' | 'out-of-possession' | 'adaptability' | 'development' | 'management'
  title: string
  points: DeepResearchPoint[]
}

export type DeepResearchProfile = {
  apiId: number
  name: string
  reviewedAt: string
  sections: DeepResearchSection[]
  sources: { url: string; title: string; publisher: string }[]
  limitations: string[]
}
