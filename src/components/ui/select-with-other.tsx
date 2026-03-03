'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const OTHER_VALUE = 'Other'

export interface SelectWithOtherProps {
  name: string
  options: string[]
  defaultValue?: string
  placeholder?: string
  required?: boolean
  className?: string
  'aria-label'?: string
  otherPlaceholder?: string
}

/**
 * Native select with an "Other" option; when selected, shows a text input.
 * Submits the custom text as the field value when "Other" is selected.
 */
export function SelectWithOther({
  name,
  options,
  defaultValue = '',
  placeholder = 'Select...',
  required = false,
  className,
  'aria-label': ariaLabel,
  otherPlaceholder = 'Type here...',
}: SelectWithOtherProps) {
  const opts = options.includes(OTHER_VALUE) ? options : [...options, OTHER_VALUE]
  const [value, setValue] = useState(defaultValue)
  const [otherText, setOtherText] = useState('')
  const resolved = value === OTHER_VALUE ? otherText : value

  return (
    <div className={cn('space-y-2', className)}>
      <input type="hidden" name={name} value={resolved} required={required} readOnly aria-hidden />
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={ariaLabel}
        className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
      >
        <option value="" disabled>{placeholder}</option>
        {opts.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {value === OTHER_VALUE && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder={otherPlaceholder}
          required={required}
          className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
        />
      )}
    </div>
  )
}
