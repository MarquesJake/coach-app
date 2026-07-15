import type { SubNavItem } from './section-shell'

export const COACHES_SUBNAV: SubNavItem[] = [
  { label: 'All coaches', href: '/coaches' },
  { label: 'Compare', href: '/coaches/compare' },
  { label: 'Watchlist', href: '/coaches/watchlist' },
  { label: 'Trusted Bench', href: '/coaches/bench' },
]

export const AGENTS_SUBNAV: SubNavItem[] = [
  { label: 'All agents', href: '/agents' },
]

export const MANDATES_SUBNAV: SubNavItem[] = [
  { label: 'Board', href: '/mandates' },
  { label: 'New mandate', href: '/mandates/new' },
]

export const COACH_PORTAL_SUBNAV: SubNavItem[] = [
  { label: 'Portal board', href: '/coach-portal' },
]

export const INTELLIGENCE_SUBNAV: SubNavItem[] = [
  { label: 'Latest intel', href: '/intelligence' },
  { label: 'Inbox', href: '/intelligence/inbox' },
  { label: 'Conversations', href: '/intelligence/conversations' },
  { label: 'Review', href: '/intelligence/review' },
]

export const NETWORK_SUBNAV: SubNavItem[] = [
  { label: 'Contacts', href: '/network' },
  { label: 'Coach research', href: '/network/corpus' },
  { label: 'Reference rounds', href: '/network/campaigns' },
]

export const STAFF_SUBNAV: SubNavItem[] = []

export const CLUBS_SUBNAV: SubNavItem[] = [
  { label: 'Clubs', href: '/clubs' },
]

export const MATCHES_SUBNAV: SubNavItem[] = []
