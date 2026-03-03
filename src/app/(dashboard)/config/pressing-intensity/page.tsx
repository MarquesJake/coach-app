import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export default async function ConfigPressingIntensityPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await getConfigList(user.id, 'config_pressing_intensity')

  return (
    <ConfigCrud
      table="config_pressing_intensity"
      title="Pressing intensity list"
      backHref="/config"
      initialItems={items}
    />
  )
}
