import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export default async function ConfigAvailabilityStatusesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await getConfigList(user.id, 'config_availability_statuses')

  return (
    <ConfigCrud
      table="config_availability_statuses"
      title="Availability statuses"
      backHref="/config"
      initialItems={items}
    />
  )
}
