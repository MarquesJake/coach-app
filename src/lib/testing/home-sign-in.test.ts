import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as portals from '../organizations/portal-entry.ts'
import { elements, uiHarness } from './ui-harness.ts'

async function home(next?: string) {
  const harness = uiHarness(new URL('../../app/page.tsx', import.meta.url), {
    '@/components/theme-toggle': { ThemeToggle: 'theme-toggle' },
    '@/lib/organizations/portal-entry': portals,
  })
  return elements(await harness.render('default', { searchParams: Promise.resolve({ next }) }))
}

test('homepage Sign in opens login rather than a same-page workspace anchor', async () => {
  const nodes = await home()
  const signIn = nodes.find(node => Array.isArray(node.props.children) && node.props.children.includes('Sign in'))!
  assert.equal(signIn.props.href, '/login')
  const chooser = nodes.find(node => Array.isArray(node.props.children) && node.props.children.includes('Pick your door'))!
  assert.equal(chooser.type, 'a')
  assert.equal(chooser.props.href, '#workspaces')
  for (const entry of portals.LISTED_PORTAL_ENTRIES) {
    assert.ok(nodes.some(node => node.props.href === entry.login), entry.id)
  }
})

test('homepage never offers the investor evaluation door', async () => {
  const nodes = await home()
  assert.ok(!nodes.some(node => node.props.href === '/investor/login'))
  assert.ok(!nodes.some(node => Array.isArray(node.props.children) && node.props.children.includes('Investor evaluation')))
  assert.deepEqual(portals.LISTED_PORTAL_ENTRIES.map(entry => entry.id), ['club', 'coach', 'internal'])
})

test('homepage sign-in retains safe appointment return paths and rejects external destinations', async () => {
  for (const [next, expected] of [['/mandates/qa/decision', '/mandates/qa/decision'], ['https://example.com', '/dashboard']]) {
    const nodes = await home(next)
    const link = nodes.find(node => Array.isArray(node.props.children) && node.props.children.includes('Sign in'))!
    const url = new URL(String(link.props.href), 'https://gaffa.invalid')
    assert.equal(url.pathname, '/login')
    assert.equal(url.searchParams.get('next'), expected)
  }
})
