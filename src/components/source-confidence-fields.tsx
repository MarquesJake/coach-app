'use client'

import { useRef } from 'react'

/** Standard source type options (stored as text; user can enter free text). */
export const SOURCE_TYPE_OPTIONS = [
  'Direct',
  'Agent',
  'Media',
  'Club',
  'Staff',
  'Internal',
  'Other',
] as const

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50'

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
      {children}
    </label>
  )
}

function ConfidenceInput({
  name,
  initial,
  disabled,
}: {
  name: string
  initial?: number
  disabled?: boolean
}) {
  const numRef = useRef<HTMLInputElement>(null)
  const defaultVal = initial != null && !Number.isNaN(initial) ? String(Math.round(Math.max(0, Math.min(100, initial)))) : ''
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        className="flex-1 h-2 rounded-lg appearance-none bg-surface border border-border"
        defaultValue={defaultVal}
        disabled={disabled}
        onChange={(e) => {
          if (numRef.current) numRef.current.value = e.target.value
        }}
      />
      <input
        ref={numRef}
        type="number"
        name={name}
        id={name}
        min={0}
        max={100}
        placeholder="—"
        className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground tabular-nums"
        defaultValue={defaultVal}
        disabled={disabled}
      />
    </div>
  )
}

export type SourceConfidenceValues = {
  source_type: string | null
  source_name: string | null
  source_link: string | null
  source_notes: string | null
  confidence: number | null
  verified: boolean
  verified_by: string | null
  verified_at: string | null
}

type Props = {
  /** Form field name prefix; default '' so names are source_type, source_name, etc. */
  namePrefix?: string
  /** Initial values (e.g. from existing record). */
  initial?: Partial<SourceConfidenceValues>
  /** Disabled state */
  disabled?: boolean
}

export function SourceConfidenceFields({ namePrefix = '', initial, disabled }: Props) {
  const p = (n: string) => (namePrefix ? `${namePrefix}_${n}` : n)
  return (
    <>
      <div className="border-t border-border pt-4 mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Source and confidence
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={p('source_type')}>Source type</Label>
            <input
              id={p('source_type')}
              name={p('source_type')}
              type="text"
              list={p('source_type_list')}
              placeholder="e.g. Direct, Agent, Media"
              className={inputClass}
              defaultValue={initial?.source_type ?? ''}
              disabled={disabled}
            />
            <datalist id={p('source_type_list')}>
              {SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor={p('source_name')}>Source name</Label>
            <input
              id={p('source_name')}
              name={p('source_name')}
              type="text"
              placeholder="Who or what"
              className={inputClass}
              defaultValue={initial?.source_name ?? ''}
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={p('source_link')}>Source link</Label>
            <input
              id={p('source_link')}
              name={p('source_link')}
              type="text"
              placeholder="URL or reference"
              className={inputClass}
              defaultValue={initial?.source_link ?? ''}
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={p('source_notes')}>Source notes</Label>
            <textarea
              id={p('source_notes')}
              name={p('source_notes')}
              rows={2}
              placeholder="Context, why credible"
              className={`${inputClass} resize-none`}
              defaultValue={initial?.source_notes ?? ''}
              disabled={disabled}
            />
          </div>
          <div>
            <Label htmlFor={p('confidence')}>Confidence (0–100)</Label>
            <ConfidenceInput name={p('confidence')} initial={initial?.confidence ?? undefined} disabled={disabled} />
            <p className="text-[10px] text-muted-foreground mt-0.5">Optional; leave empty if not set.</p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={p('verified')}
                name={p('verified')}
                defaultChecked={initial?.verified ?? false}
                className="rounded border-border"
                disabled={disabled}
              />
              <label htmlFor={p('verified')} className="text-sm font-medium text-foreground">
                Verified
              </label>
            </div>
            <div>
              <Label htmlFor={p('verified_by')}>Verified by</Label>
              <input
                id={p('verified_by')}
                name={p('verified_by')}
                type="text"
                placeholder="Initials or name"
                className={inputClass}
                defaultValue={initial?.verified_by ?? ''}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Verified at is set automatically when you save with Verified on.</p>
      </div>
    </>
  )
}

/** Minimal intel pill for list rows and detail cards: confidence badge, verified badge, source type/name. */
export function IntelPill({
  confidence,
  verified,
  sourceType,
  sourceName,
  className,
}: {
  confidence?: number | null
  verified?: boolean
  sourceType?: string | null
  sourceName?: string | null
  className?: string
}) {
  const hasConfidence = confidence != null && !Number.isNaN(Number(confidence))
  const hasSource = (sourceType && sourceType.trim()) || (sourceName && sourceName.trim())
  if (!hasConfidence && !verified && !hasSource) return null
  return (
    <span className={className} title="Source and confidence">
      {hasConfidence && (
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums bg-muted/60 text-muted-foreground border border-border/50">
          {Math.round(Number(confidence))}%
        </span>
      )}
      {verified && (
        <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary border border-primary/30">
          Verified
        </span>
      )}
      {hasSource && (
        <span className="ml-1 text-[10px] text-muted-foreground truncate max-w-[120px] inline-block align-middle" title={[sourceType, sourceName].filter(Boolean).join(' · ')}>
          {[sourceType, sourceName].filter(Boolean).join(' · ')}
        </span>
      )}
    </span>
  )
}
