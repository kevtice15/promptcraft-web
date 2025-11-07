import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()
  
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PromptCraft</h1>
          <p className="text-gray-600 mt-2">Organize your AI prompts</p>
        </div>
        {children}
      </div>
    </div>
  )
}