'use client'

import { ReactNode } from 'react'
import { TopNavigation } from './top-navigation'
import { SessionUser } from '@/types'

interface MainLayoutProps {
  user: SessionUser
  libraryName?: string
  onLibrarySwitch?: () => void
  sidebar?: ReactNode
  children: ReactNode
}

export function MainLayout({ 
  user, 
  libraryName, 
  onLibrarySwitch, 
  sidebar, 
  children 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation 
        user={user} 
        libraryName={libraryName}
        onLibrarySwitch={onLibrarySwitch}
      />
      
      <div className="flex">
        {sidebar && sidebar}
        
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}