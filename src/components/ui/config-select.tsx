'use client'

import { useRef, useState, useId, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { createConfigAction } from '@/app/(dashboard)/config/actions'
import type { ConfigTableName } from '@/lib/db/config'

export type ConfigOption = { id: string; name: string }

export interface ConfigSelectProps {
  /** Config options (e.g. from getConfigList). */
  options: ConfigOption[]
  /** Config table for "add new" (creates row and uses new name as value). */
  configTable: ConfigTableName
  /** Human-readable label for "add to config" (e.g. "style", "pressing level"). */
  configLabel?: string
  /** Form field name; hidden input holds the chosen text value. */
  name?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  required?: boolean
  'aria-label'?: string
  className?: string
  /** When true, allow only free text (no "add to config"); still show config options to pick. */
  freeTextOnly?: boolean
}

/**
 * Combobox: select from config options, type to create new config item, or use free text.
 * Submitted/stored value is always the display string (name), not the config id.
 */
export function ConfigSelect({
  options,
  configTable,
  configLabel = 'option',
  name,
  placeholder = 'Select or type...',
  value: controlledValue,
  defaultValue = '',
  onChange: controlledOnChange,
  required = false,
  'aria-label': ariaLabel,
  className,
  freeTextOnly = false,
}: ConfigSelectProps) {
  const isControlled = controlledValue !== undefined
  const [inputValue, setInputValue] = useState(() => {
    const v = isControlled ? (controlledValue ?? '') : defaultValue
    return v
  })
  const [createdThisSession, setCreatedThisSession] = useState<ConfigOption[]>([])
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [adding, setAdding] = useState(false)
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)

  const displayOptions = [...options, ...createdThisSession]
  const query = inputValue.trim()
  const queryLower = query.toLowerCase()
  const filtered =
    query.length === 0
      ? displayOptions
      : displayOptions.filter((o) => o.name.toLowerCase().includes(queryLower))

  const hasMatch = filtered.some((o) => o.name.toLowerCase() === queryLower)
  const showAddOptions = query.length > 0 && !hasMatch
  const optionCount = filtered.length + (showAddOptions ? (freeTextOnly ? 1 : 2) : 0)

  useEffect(() => {
    if (!isControlled) return
    setInputValue(controlledValue ?? '')
  }, [controlledValue, isControlled])

  useEffect(() => {
    if (open && focusedIndex >= 0 && listRef.current?.children[focusedIndex]) {
      listRef.current.children[focusedIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [open, focusedIndex])

  function commitValue(val: string) {
    setInputValue(val)
    setOpen(false)
    setFocusedIndex(0)
    controlledOnChange?.(val)
  }

  async function handleAddToConfig() {
    if (!query) return
    setAdding(true)
    const { data, error } = await createConfigAction(configTable, { name: query })
    setAdding(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess(`Added "${query}" to ${configLabel}`)
    if (data && typeof data === 'object' && 'id' in data && 'name' in data) {
      setCreatedThisSession((prev) => prev.concat({ id: (data as { id: string }).id, name: (data as { name: string }).name }))
    }
    commitValue(query)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      setFocusedIndex(0)
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowDown') {
      setFocusedIndex((i) => (i < optionCount - 1 ? i + 1 : i))
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowUp') {
      setFocusedIndex((i) => (i > 0 ? i - 1 : 0))
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' && open) {
      if (showAddOptions) {
        if (freeTextOnly && focusedIndex === 0) {
          commitValue(query)
          e.preventDefault()
          return
        }
        if (!freeTextOnly && focusedIndex === 0) {
          handleAddToConfig()
          e.preventDefault()
          return
        }
        if (!freeTextOnly && focusedIndex === 1) {
          commitValue(query)
          e.preventDefault()
          return
        }
        if (freeTextOnly) {
          commitValue(query)
          e.preventDefault()
          return
        }
      }
      const opt = filtered[focusedIndex]
      if (opt) {
        commitValue(opt.name)
        e.preventDefault()
      }
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIndex(0)
      e.preventDefault()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value
          setInputValue(v)
          controlledOnChange?.(v)
          setFocusedIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
        placeholder={placeholder}
      />
      {name != null && (
        <input type="hidden" name={name} value={inputValue} required={required} readOnly aria-hidden />
      )}
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded border border-border bg-surface shadow-lg py-1"
        >
          {filtered.length === 0 && !showAddOptions && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {query.length === 0 ? 'No options' : 'No match'}
            </li>
          )}
          {showAddOptions && (
            <>
              {!freeTextOnly && (
                <li
                  role="option"
                  aria-selected={focusedIndex === 0}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer transition-colors',
                    focusedIndex === 0 ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-surface-overlay/30'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleAddToConfig()
                  }}
                >
                  {adding ? 'Adding…' : `Add "${query}" to ${configLabel} and use`}
                </li>
              )}
              <li
                role="option"
                aria-selected={focusedIndex === (freeTextOnly ? 0 : 1)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer transition-colors',
                  focusedIndex === (freeTextOnly ? 0 : 1) ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-surface-overlay/30'
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commitValue(query)
                }}
              >
                {freeTextOnly ? `Use "${query}"` : `Use "${query}" as free text only`}
              </li>
            </>
          )}
          {filtered.map((opt, i) => {
            const idx = i + (showAddOptions ? (freeTextOnly ? 1 : 2) : 0)
            return (
              <li
                key={opt.id}
                role="option"
                aria-selected={focusedIndex === idx}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer transition-colors',
                  focusedIndex === idx ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-surface-overlay/30'
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commitValue(opt.name)
                }}
              >
                {opt.name}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
