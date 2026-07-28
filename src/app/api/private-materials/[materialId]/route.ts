import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrganizationAccessProfile } from '@/lib/organizations/context'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest, props: { params: Promise<{ materialId: string }> }) {
  const params = await props.params;
  const orderId = request.nextUrl.searchParams.get('order')
  if ((orderId && !UUID.test(orderId)) || !UUID.test(params.materialId)) {
    return NextResponse.json({ error: 'Invalid material access request.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let storagePath: string | null = null
  let allowDownload = false
  if (orderId) {
    const { data, error } = await supabase.rpc('record_private_material_access', {
      target_order_id: orderId,
      target_material_id: params.materialId,
    })
    const access = data?.[0]
    if (error || !access?.storage_path) {
      return NextResponse.json(
        { error: 'This material is unavailable, expired or has not been approved for release.' },
        { status: 403 }
      )
    }
    storagePath = access.storage_path
    allowDownload = access.allow_download
  } else {
    const access = await getOrganizationAccessProfile(user.id)
    if (!access.hasActiveInternalAccess && !access.hasActiveCoachAccess) {
      return NextResponse.json({ error: 'Material access is not available.' }, { status: 403 })
    }
    const { data: material } = await supabase
      .from('coach_private_materials')
      .select('storage_path, upload_status')
      .eq('id', params.materialId)
      .maybeSingle()
    if (!material?.storage_path || material.upload_status !== 'uploaded') {
      return NextResponse.json({ error: 'The uploaded file is not available.' }, { status: 404 })
    }
    storagePath = material.storage_path
    allowDownload = access.hasActiveCoachAccess
  }

  const signedUrlOptions = allowDownload ? { download: true } : undefined
  const { data: signed, error: signedError } = await supabase.storage
    .from('coach-private-materials')
    .createSignedUrl(storagePath, 60, signedUrlOptions)

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Secure material delivery failed.' }, { status: 503 })
  }

  const response = NextResponse.redirect(signed.signedUrl, 303)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
