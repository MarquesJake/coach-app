import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('../../app/', import.meta.url))
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)])
}

test('literal local page links resolve to a declared app page or route', () => {
  const inventory = files(root)
  const routes = inventory.filter(file => /\/(?:page\.tsx|route\.ts)$/.test(file)).map(file => {
    const segments = relative(root, file).split('/').slice(0, -1).filter(segment => !segment.startsWith('(') && !segment.startsWith('@'))
    const pattern = segments.map(segment => segment.startsWith('[[...') ? '.*' : segment.startsWith('[...') ? '.+' : segment.startsWith('[') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/')
    return new RegExp(`^/${pattern}/?$`)
  })
  const failures: string[] = []
  let checked = 0
  for (const file of inventory.filter(file => file.endsWith('.tsx'))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/href\s*=\s*["'](\/[^"'{}]*)["']/g)) {
      if (match[1].startsWith('//')) continue
      const path = new URL(match[1], 'https://gaffa.invalid').pathname
      if (/\.[a-z0-9]+$/i.test(path)) continue // Static public assets are not app routes.
      checked++
      if (!routes.some(route => route.test(path))) failures.push(`${relative(root, file)} -> ${path}`)
    }
  }
  assert.ok(checked > 100, 'the check must cover the application, not just a handful of fixtures')
  assert.deepEqual(failures, [])
})
