import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { ConfigCrud } from '../_components/ConfigCrud'

export const metadata = { title: 'Pipeline stages · Config' }


export default async function ConfigPipelineStagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items, error } = await getConfigList(user.id, 'config_pipeline_stages')

  return (
    <ConfigCrud
      table="config_pipeline_stages"
      title="Pipeline stages"
      backHref="/config"
      initialItems={items}
      loadError={Boolean(error)}
    />
  )
}
