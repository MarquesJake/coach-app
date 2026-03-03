'use client'

import { useRouter } from 'next/navigation'
import { clearStoredCompareIds } from '@/lib/compare'

export function CompareClearButton() {
  const router = useRouter()

  const handleClear = () => {
    clearStoredCompareIds()
    router.push('/coaches')
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      Clear
    </button>
  )
}
