import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getSession()
  
  if (!user) {
    redirect('/login')
  }

  // Redirect authenticated users to dashboard
  redirect('/dashboard')
}