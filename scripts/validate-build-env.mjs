import { existsSync, readFileSync } from 'node:fs'

function loadEnvFile(path) {
  if (!existsSync(path)) return

  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] ??= value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const requiredPublicEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const missing = requiredPublicEnv.filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error('\nMissing required build environment variables:')
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  console.error('\nSet these in .env.local for local builds and in Vercel for preview/production builds.\n')
  process.exit(1)
}

try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('Supabase URL must use https, localhost, or 127.0.0.1')
  }
} catch (error) {
  console.error('\nInvalid NEXT_PUBLIC_SUPABASE_URL.')
  console.error(error instanceof Error ? error.message : String(error))
  console.error('')
  process.exit(1)
}
