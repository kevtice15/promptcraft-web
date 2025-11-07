import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { clearUnlockedLibraries } from '@/lib/library-access'

export async function POST(request: NextRequest) {
  try {
    // Clear session
    await deleteSession()
    
    // Clear unlocked libraries
    await clearUnlockedLibraries()

    return NextResponse.json({
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}