'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavigation } from '@/components/layout/top-navigation'
import { UnlockLibraryModal } from '@/components/library/unlock-library-modal'
import { SessionUser } from '@/types'
import { Library } from '@prisma/client'

export default function UnlockLibraryPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [library, setLibrary] = useState<Library | null>(null)
  const [loading, setLoading] = useState(true)

  const libraryId = params.libraryId as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
        }

        // Get basic library info (without requiring unlock)
        const response = await fetch(`/api/libraries`)
        if (response.ok) {
          const data = await response.json()
          const targetLibrary = data.libraries.find((lib: Library) => lib.id === libraryId)
          
          if (targetLibrary) {
            setLibrary(targetLibrary)
          } else {
            // Library not found, redirect to dashboard
            router.push('/')
          }
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [libraryId, router])

  const handleUnlockSuccess = () => {
    router.push(`/library/${libraryId}`)
  }

  const handleClose = () => {
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 73px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation user={user} libraryName={library?.name} />
      <UnlockLibraryModal
        isOpen={true}
        onClose={handleClose}
        library={library}
        onSuccess={handleUnlockSuccess}
      />
    </div>
  )
}