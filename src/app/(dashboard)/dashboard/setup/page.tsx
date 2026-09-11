import { redirect } from 'next/navigation'

export const metadata = { title: 'Setup · Today' }


export default function DashboardSetupPage() {
  redirect('/dashboard')
}
