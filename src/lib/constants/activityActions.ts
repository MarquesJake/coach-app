import {
  UserPlus,
  Pencil,
  Briefcase,
  GitBranch,
  FileText,
  CircleDot,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/**
 * Map action_type to icon component. Add new action types here.
 */
export const ACTION_TYPE_ICONS: Record<string, LucideIcon> = {
  created: Briefcase,
  updated: Pencil,
  stage_changed: GitBranch,
  shortlist_added: UserPlus,
  shortlist_updated: Pencil,
  coach_created: UserPlus,
  coach_updated: Pencil,
  risk_flag_changed: ShieldAlert,
  intelligence_added: Sparkles,
  mandate_created: Briefcase,
  vacancy_created: FileText,
}

export function getIconForActionType(actionType: string): LucideIcon {
  return ACTION_TYPE_ICONS[actionType] ?? CircleDot
}
