import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as React from 'react'
import ts from 'typescript'

const require = createRequire(import.meta.url)
export type TestElement = React.ReactElement<Record<string, unknown>>

/** Invokes the actual component handlers with deterministic hooks; no browser or network. */
export function uiHarness(file: URL, mocks: Record<string, unknown> = {}, environment: Record<string, unknown> = {}) {
  const slots: unknown[] = []
  let cursor = 0
  const react = {
    ...React,
    useState(initial: unknown) {
      const slot = cursor++
      if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial
      return [slots[slot], (next: unknown) => { slots[slot] = typeof next === 'function' ? next(slots[slot]) : next }]
    },
    useRef(initial: unknown) {
      const slot = cursor++
      if (!(slot in slots)) slots[slot] = { current: initial }
      return slots[slot]
    },
    useId: () => 'fixture-id',
    useEffect: () => {},
    useTransition: () => [false, (action: () => unknown) => action()],
  }
  const modules: Record<string, unknown> = { react, 'next/link': { __esModule: true, default: 'a' }, ...mocks }
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exported: Record<string, (props: Record<string, unknown>) => TestElement> = {}
  new Function('require', 'exports', ...Object.keys(environment), code)((id: string) => id in modules ? modules[id] : require(id), exported, ...Object.values(environment))
  return { render(name: string, props: Record<string, unknown>) { cursor = 0; return exported[name](props) }, slots }
}

export function elements(node: unknown): TestElement[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!React.isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children)]
}
