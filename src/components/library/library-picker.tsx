'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/top-navigation'
import { LibraryCard } from './library-card'
import { CreateLibraryModal } from './create-library-modal'
import { UnlockLibraryModal } from './unlock-library-modal'
import { LibraryWithGroups, SessionUser } from '@/types'
import { Library } from '@prisma/client'

type LibraryWithCounts = LibraryWithGroups & {
  groups: Array<{
    id: string
    name: string
    _count: { prompts: number }
  }>
}

type SharedLibrary = LibraryWithCounts & {
  permission: string
  owner: {
    name: string | null
    email: string
  }
}

export function LibraryPicker() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [libraries, setLibraries] = useState<LibraryWithCounts[]>([])
  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null)
  const router = useRouter()

  const fetchData = async () => {
    try {
      // Get current user
      const userResponse = await fetch('/api/auth/me')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
      }

      // Get libraries
      const response = await fetch('/api/libraries')
      const data = await response.json()
      
      if (response.ok) {
        setLibraries(data.libraries || [])
        setSharedLibraries(data.sharedLibraries || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLibraries = async () => {
    try {
      const response = await fetch('/api/libraries')
      const data = await response.json()
      
      if (response.ok) {
        setLibraries(data.libraries || [])
        setSharedLibraries(data.sharedLibraries || [])
      }
    } catch (error) {
      console.error('Failed to fetch libraries:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLibraryClick = async (library: LibraryWithCounts | SharedLibrary) => {
    if (library.isPrivate) {
      // Check if library is already unlocked by trying to access it
      try {
        const response = await fetch(`/api/libraries/${library.id}`)
        if (response.status === 401 || response.status === 403) {
          // Library is locked, show unlock modal
          setSelectedLibrary(library)
          setShowUnlockModal(true)
          return
        }
      } catch (error) {
        // If there's an error, assume it's locked
        setSelectedLibrary(library)
        setShowUnlockModal(true)
        return
      }
    }
    
    // Navigate to library
    router.push(`/library/${library.id}`)
  }

  const handleUnlockSuccess = () => {
    if (selectedLibrary) {
      router.push(`/library/${selectedLibrary.id}`)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation showLibraryPicker={false} />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 73px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading libraries...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation 
        user={user} 
        showLibraryPicker={false}
        rightContent={
          <Button onClick={() => setShowCreateModal(true)}>
            Create New Library
          </Button>
        }
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Libraries</h1>
          <p className="text-gray-600 mt-2">
            Choose a library to manage your prompts
          </p>
        </div>

        {libraries.length === 0 && sharedLibraries.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No libraries yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first library to start organizing your AI prompts
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Library
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {libraries.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Libraries</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraries.map((library) => (
                    <LibraryCard
                      key={library.id}
                      library={library}
                      onClick={() => handleLibraryClick(library)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {sharedLibraries.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shared with You</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sharedLibraries.map((library) => (
                    <LibraryCard
                      key={library.id}
                      library={library}
                      onClick={() => handleLibraryClick(library)}
                      isShared={true}
                      sharedBy={library.owner.name || library.owner.email}
                      permission={library.permission}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <CreateLibraryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchLibraries}
        />

        <UnlockLibraryModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          library={selectedLibrary}
          onSuccess={handleUnlockSuccess}
        />
      </div>
    </div>
  )
}