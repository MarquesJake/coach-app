import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/db'

type Row = Record<string, unknown>

/** Exercise the real query builder against fixture rows; every request stays in memory. */
export function appointmentWriteFixture(initial: Record<string, Row[]>) {
  const rows = structuredClone(initial)
  const requests: Array<{ table: string; method: string; url: URL }> = []
  const controls = {
    failMethod: '',
    skipDelete: false,
    beforeWrite: null as (() => void) | null,
  }
  const client = createClient<Database>('https://appointment-fixture.invalid', 'fixture-only', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input))
        const table = url.pathname.split('/').pop()!
        const method = init?.method ?? 'GET'
        if (url.hostname !== 'appointment-fixture.invalid' || !Object.hasOwn(rows, table)) {
          throw new Error(`Unexpected fixture request: ${url}`)
        }
        requests.push({ table, method, url })
        if (controls.failMethod === method) {
          return Response.json({ message: 'Fixture persistence failure' }, { status: 403 })
        }
        if (method !== 'GET') controls.beforeWrite?.()
        const matches = (row: Row) => [...url.searchParams].every(([key, filter]) => {
          if (['select', 'order', 'on_conflict', 'columns'].includes(key)) return true
          if (filter === 'is.null') return row[key] == null
          if (filter.startsWith('eq.')) return String(row[key]) === filter.slice(3)
          if (filter.startsWith('neq.')) return row[key] != null && String(row[key]) !== filter.slice(4)
          if (filter.startsWith('in.(')) return filter.slice(4, -1).split(',').includes(String(row[key]))
          throw new Error(`Unhandled fixture filter: ${filter}`)
        })
        let selected = rows[table].filter(matches)
        if (method === 'DELETE') {
          if (!controls.skipDelete) rows[table] = rows[table].filter((row) => !matches(row))
        } else if (method === 'PATCH') {
          const payload = JSON.parse(String(init?.body)) as Row
          selected.forEach((row) => Object.assign(row, payload))
        } else if (method === 'POST') {
          const payload = JSON.parse(String(init?.body)) as Row[]
          const conflictKeys = url.searchParams.get('on_conflict')!.split(',')
          selected = payload.map((value) => {
            const existing = rows[table].find((row) => conflictKeys.every((key) => row[key] === value[key]))
            if (existing) return Object.assign(existing, value)
            const inserted = { id: `fixture-${rows[table].length}`, ...value }
            rows[table].push(inserted)
            return inserted
          })
        } else if (method !== 'GET') {
          throw new Error(`Unhandled fixture method: ${method}`)
        }
        if (url.searchParams.get('order') === 'ranking_score.desc') {
          selected.sort((a, b) => Number(b.ranking_score) - Number(a.ranking_score))
        }
        if (new Headers(init?.headers).get('accept')?.includes('application/vnd.pgrst.object+json')) {
          if (selected.length !== 1) {
            return Response.json({ code: 'PGRST116', message: 'Expected one row', details: `The result contains ${selected.length} rows` }, { status: 406 })
          }
          return Response.json(selected[0])
        }
        return Response.json(selected)
      },
    },
  })
  return { client, rows, requests, controls }
}
