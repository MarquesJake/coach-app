'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'coach-first-theme'

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const nextDark = !isDark
    document.documentElement.classList.toggle('dark', nextDark)
    document.documentElement.classList.toggle('light', !nextDark)
    window.localStorage.setItem(STORAGE_KEY, nextDark ? 'dark' : 'light')
    setIsDark(nextDark)
  }

  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Use light appearance' : 'Use dark appearance'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
        className
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}
