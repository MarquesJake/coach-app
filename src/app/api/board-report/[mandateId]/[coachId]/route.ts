import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const runtime = 'nodejs'
export const maxDuration = 60
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest, { params }: { params: Promise<{ mandateId: string; coachId: string }> }) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ error: 'Use the report download button' }, { status: 403 })
  const { mandateId, coachId } = await params
  if (!uuid.test(mandateId) || (coachId !== 'shortlist' && !uuid.test(coachId))) return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to download this report' }, { status: 401 })
  // Check access with the caller's session and RLS before starting a browser.
  const { data: mandate } = await supabase.from('mandates').select('id').eq('id', mandateId).maybeSingle()
  if (!mandate) return NextResponse.json({ error: 'Report not available' }, { status: 404 })
  // The target is fixed by deployment configuration, never a caller-supplied URL.
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3107'
  const reportPath = coachId === 'shortlist' ? `/mandates/${mandateId}/shortlist-report` : `/mandates/${mandateId}/assessment/${coachId}/board-pack`
  const url = `${origin}${reportPath}`
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || request.headers.get('x-vercel-protection-bypass')
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  let browser
  let stage = 'launch'
  try {
    browser = await puppeteer.launch({
      args: process.env.VERCEL ? chromium.args : ['--no-sandbox'],
      executablePath: process.env.VERCEL ? await chromium.executablePath() : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 1200, deviceScaleFactor: 1 })
    await page.setRequestInterception(true)
    page.on('request', req => {
      // Never forward session cookies or fetch private links outside this deployment.
      if (!req.url().startsWith(`${origin}/`)) { void req.abort(); return }
      const headers: Record<string, string> = { ...req.headers(), cookie: cookieHeader }
      if (bypass) headers['x-vercel-protection-bypass'] = bypass
      void req.continue({ headers })
    })
    stage = 'load report'
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 40000 })
    if (!response?.ok() || new URL(page.url()).pathname !== reportPath) throw new Error('Report unavailable')
    await page.waitForSelector('#board-pack-root', { timeout: 5000 })
    const title = await page.title()
    await page.evaluate(async () => {
      await document.fonts.ready
      const root = document.querySelector('#board-pack-root') as HTMLElement
      root.querySelectorAll('details').forEach(detail => { detail.open = true })
      // Print only this report; preserve ancestor theme classes and inherited variables.
      let element: HTMLElement = root
      while (element.parentElement) {
        for (const sibling of Array.from(element.parentElement.children)) {
          if (sibling !== element && sibling instanceof HTMLElement) sibling.style.display = 'none'
        }
        element = element.parentElement
        element.style.margin = '0'
        element.style.padding = '0'
        element.style.minHeight = '0'
        element.style.background = 'white'
      }
    })
    stage = 'render PDF'
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font-size:8px;color:#64748b;text-align:center">GAFFA · Confidential · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    })
    const filename = `${title.replace(/[^a-zA-Z0-9 ._-]/g, '-').slice(0, 150)}.pdf`
    return new Response(new Uint8Array(pdf), { headers: {
      'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    } })
  } catch {
    console.error('Board report PDF generation failed at', stage)
    return NextResponse.json({ error: 'Could not generate PDF. Try again or use Print / Save as PDF.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  } finally { await browser?.close().catch(() => undefined) }
}
