import { readFileSync } from 'node:fs'
import ts from 'typescript'

/** Run scoped regression targets with injected services; no external modules or live I/O. */
export function loadScopedAction(file: URL, modules: Record<string, unknown> = {}): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  new Function('require', 'exports', code)((id: string) => {
    if (id in modules) return modules[id]
    if (id.startsWith('.')) return loadScopedAction(new URL(/\.ts$/.test(id) ? id : `${id}.ts`, file), modules)
    throw new Error(`Unexpected dependency: ${id}`)
  }, exports)
  return exports
}
