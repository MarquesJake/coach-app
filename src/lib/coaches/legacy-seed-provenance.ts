import { createHash } from 'node:crypto'

// Exact generator from b7da3c8^: admin/data-tools/demo-seed.ts and seed-demo-impl.ts.
// Identifies original seed records, not names or subsequent independently sourced edits.
function seedId(owner: string, prefix: string, index: number) {
  const bytes = Array.from(createHash('sha256').update(`${owner}:demo:${prefix}:${index}`).digest().subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}
const stintCounts = [4, 5, 3, 6, 4, 5, 3, 4, 5, 4, 3, 5]
export function legacyCoachSeedIndex(owner: string | null | undefined, coachId: string): number {
  return owner ? stintCounts.findIndex((_, index) => seedId(owner, 'coach', index) === coachId) : -1
}
export function isLegacySeededStint(owner: string | null | undefined, coachId: string, stintId: string): boolean {
  const index = legacyCoachSeedIndex(owner, coachId)
  return Boolean(owner && index >= 0 && Array.from({ length: stintCounts[index] }, (_, s) => seedId(owner!, `stint-${index}`, s)).includes(stintId))
}
