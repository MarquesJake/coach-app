'use client'

import { useEffect, useRef, useState, useId } from 'react'
import { cn } from '@/lib/utils'

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export type FlexibleSelectOption = { id: string; label: string }

export interface FlexibleSelectProps {
  /** Options to show (e.g. existing clubs). Can be empty; user can still type. */
  options: FlexibleSelectOption[]
  /** Form field name; when set, a hidden input is rendered with submit value (id or free text). */
  name?: string
  placeholder?: string
  /** Initial value (id or free text) for uncontrolled use. */
  defaultValue?: string
  /** Initial display string when defaultValue is an id and options are available. */
  defaultDisplay?: string
  /** Controlled value (id or free text). */
  value?: string
  /** Controlled change callback. */
  onChange?: (value: string) => void
  /** Message when options list is empty. */
  emptyMessage?: string
  /** Message when query has no match (e.g. "No match — will create new"). */
  noMatchMessage?: string
  /** When true and there is typed text with no match, show option to submit as "custom:&lt;text&gt;" (store name only, no create). */
  allowCustomOnly?: boolean
  required?: boolean
  'aria-label'?: string
  className?: string
}

/**
 * Reusable combobox: shows options, allows free text.
 * Submit value is either selected option id or the typed string (so server can create entity or store custom).
 */
export function FlexibleSelect({
  options,
  name,
  placeholder = 'Select or type...',
  defaultValue = '',
  defaultDisplay = '',
  value: controlledValue,
  onChange: controlledOnChange,
  emptyMessage = 'No options',
  noMatchMessage = 'No match — will create new',
  allowCustomOnly = false,
  required = false,
  'aria-label': ariaLabel,
  className,
}: FlexibleSelectProps) {
  const isControlled = controlledValue !== undefined

  const getDisplayForValue = (val: string) => {
    if (!val) return ''
    if (val.startsWith('custom:')) return val.slice(7).trim()
    if (isUuid(val)) {
      const opt = options.find((o) => o.id === val)
      return opt ? opt.label : val
    }
    return val
  }

  const [inputValue, setInputValue] = useState(() => {
    if (isControlled && controlledValue !== undefined) return getDisplayForValue(controlledValue)
    if (defaultValue && defaultDisplay) return defaultDisplay
    if (defaultValue) return getDisplayForValue(defaultValue)
    return ''
  })
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (defaultValue && isUuid(defaultValue)) return defaultValue
    return null
  })
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [customOnlySelected, setCustomOnlySelected] = useState(false)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const query = inputValue.trim()
  const queryLower = query.toLowerCase()
  const filtered =
    query.length === 0
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(queryLower))

  const showCustomOnlyOption = allowCustomOnly && query.length > 0 && filtered.length === 0
  const submitValue =
    selectedId ??
    (customOnlySelected ? `custom:${query}` : query)

  // Sync controlled value to display (e.g. when options load after initial render)
  useEffect(() => {
    if (!isControlled) return
    const val = controlledValue ?? ''
    const display = getDisplayForValue(val)
    setInputValue(display)
    setSelectedId(val && !val.startsWith('custom:') && isUuid(val) ? val : null)
    setCustomOnlySelected(val.startsWith('custom:') && val.length > 7)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- getDisplayForValue is stable per render
  }, [controlledValue, isControlled, options])

  useEffect(() => {
    if (open && focusedIndex >= 0 && listRef.current?.children[focusedIndex]) {
      listRef.current.children[focusedIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [open, focusedIndex])

  function selectOption(opt: FlexibleSelectOption) {
    setSelectedId(opt.id)
    setInputValue(opt.label)
    setCustomOnlySelected(false)
    setOpen(false)
    setFocusedIndex(-1)
    controlledOnChange?.(opt.id)
  }

  function clearSelection() {
    setSelectedId(null)
    setCustomOnlySelected(false)
    setFocusedIndex(-1)
  }

  function applyCustomOnly() {
    setCustomOnlySelected(true)
    setSelectedId(null)
    setOpen(false)
    setFocusedIndex(-1)
    controlledOnChange?.(`custom:${query}`)
  }

  function applyCreateNew() {
    setCustomOnlySelected(false)
    setSelectedId(null)
    setOpen(false)
    setFocusedIndex(-1)
    controlledOnChange?.(query)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputValue(v)
    clearSelection()
    setFocusedIndex(0)
    setOpen(true)
    controlledOnChange?.(v.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      setFocusedIndex(0)
      e.preventDefault()
      return
    }
    const optionCount = filtered.length + (showCustomOnlyOption ? 2 : 0)
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
      if (showCustomOnlyOption) {
        if (focusedIndex === 0) {
          applyCustomOnly()
          e.preventDefault()
          return
        }
        if (focusedIndex === 1) {
          applyCreateNew()
          e.preventDefault()
          return
        }
      }
      if (filtered[focusedIndex]) {
        selectOption(filtered[focusedIndex])
        e.preventDefault()
        return
      }
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIndex(-1)
      e.preventDefault()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          setOpen(true)
          if (filtered.length) setFocusedIndex(0)
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
        }}
        onKeyDown={handleKeyDown}
        className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
        placeholder={placeholder}
      />
      {name != null && (
        <input
          type="hidden"
          name={name}
          value={submitValue}
          required={required}
          readOnly
          aria-hidden
        />
      )}
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded border border-border bg-surface shadow-lg py-1"
        >
          {filtered.length === 0 && !showCustomOnlyOption ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {query.length === 0 ? emptyMessage : noMatchMessage}
            </li>
          ) : (
            <>
              {showCustomOnlyOption && (
                <>
                  <li
                    role="option"
                    aria-selected={focusedIndex === 0}
                    className={cn(
                      'px-3 py-2 text-sm cursor-pointer transition-colors',
                      focusedIndex === 0
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-surface-overlay/30'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyCustomOnly()
                  }}
                >
                  Use &quot;{query}&quot; as custom name only (no club created)
                </li>
                  <li
                    role="option"
                    aria-selected={focusedIndex === 1}
                    className={cn(
                      'px-3 py-2 text-sm cursor-pointer transition-colors',
                      focusedIndex === 1
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-surface-overlay/30'
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyCreateNew()
                    }}
                  >
                    Create new club &quot;{query}&quot;
                  </li>
                </>
              )}
              {filtered.map((opt, i) => {
                const idx = i + (showCustomOnlyOption ? 2 : 0)
                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={focusedIndex === idx}
                    className={cn(
                      'px-3 py-2 text-sm cursor-pointer transition-colors',
                      focusedIndex === idx
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-surface-overlay/30'
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectOption(opt)
                    }}
                  >
                    {opt.label}
                  </li>
                )
              })}
            </>
          )}
        </ul>
      )}
    </div>
  )
}
