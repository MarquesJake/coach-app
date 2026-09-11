export const TOTTENHAM_SCENARIO_ID = '09420a64-b4d2-4245-8088-af0dc88266eb'
export function isTottenhamScenario(id: string, name: string | null | undefined) {
  return id === TOTTENHAM_SCENARIO_ID && /internal scenario/i.test(name ?? '')
}
