'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'

interface TopNavigationProps {
  user?: SessionUser
  libraryName?: string
  showLibraryPicker?: boolean
  onLibrarySwitch?: () => void
  rightContent?: React.ReactNode
}

export function TopNavigation({ 
  user, 
  libraryName, 
  showLibraryPicker = true,
  onLibrarySwitch,
  rightContent 
}: TopNavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLibrariesClick = () => {
    router.push('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLibrariesClick}
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            PromptCraft
          </button>
          
          {libraryName && showLibraryPicker && (
            <>
              <div className="text-gray-300">•</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Library:</span>
                <button
                  onClick={onLibrarySwitch || handleLibrariesClick}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {libraryName}
                </button>
              </div>
            </>
          )}
          
          {!libraryName && showLibraryPicker && (
            <>
              <div className="text-gray-300">•</div>
              <span className="text-gray-600">Libraries</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {rightContent}
          
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">
                  {user.name || user.email}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleLibrariesClick()
                      setShowUserMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    All Libraries
                  </button>
                  
                  {onLibrarySwitch && (
                    <button
                      onClick={() => {
                        onLibrarySwitch()
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Switch Library
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}