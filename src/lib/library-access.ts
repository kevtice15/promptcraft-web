import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { Library } from '@prisma/client'
import { getSession } from './auth'

// In-memory storage for unlocked libraries per user
// In production, you might want to use Redis or similar
const unlockedLibraries = new Map<string, Set<string>>()

async function getUserId(): Promise<string | null> {
  try {
    const user = await getSession()
    return user?.id || null
  } catch (error) {
    return null
  }
}

export async function isLibraryUnlocked(libraryId: string): Promise<boolean> {
  const userId = await getUserId()
  if (!userId) return false
  
  const unlockedSet = unlockedLibraries.get(userId)
  return unlockedSet?.has(libraryId) || false
}

export async function unlockLibrary(libraryId: string, password: string): Promise<boolean> {
  try {
    const library = await prisma.library.findUnique({
      where: { id: libraryId }
    })

    if (!library || !library.isPrivate || !library.passwordHash) {
      return false
    }

    const isValid = await bcrypt.compare(password, library.passwordHash)
    if (!isValid) {
      return false
    }

    const userId = await getUserId()
    if (!userId) return false

    if (!unlockedLibraries.has(userId)) {
      unlockedLibraries.set(userId, new Set())
    }
    unlockedLibraries.get(userId)!.add(libraryId)

    return true
  } catch (error) {
    console.error('Library unlock error:', error)
    return false
  }
}

export async function lockLibrary(libraryId: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) return
  
  const unlockedSet = unlockedLibraries.get(userId)
  if (unlockedSet) {
    unlockedSet.delete(libraryId)
  }
}

export async function clearUnlockedLibraries(): Promise<void> {
  const userId = await getUserId()
  if (!userId) return
  
  unlockedLibraries.delete(userId)
}

export async function requireLibraryAccess(library: Library): Promise<void> {
  // If the library is public, always allow access
  if (!library.isPrivate) {
    return
  }

  // For private libraries, check if user has unlocked it
  const isUnlocked = await isLibraryUnlocked(library.id)
  if (!isUnlocked) {
    throw new Error('LIBRARY_LOCKED')
  }
}

export async function markLibraryAsAccessible(libraryId: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) return
  
  if (!unlockedLibraries.has(userId)) {
    unlockedLibraries.set(userId, new Set())
  }
  unlockedLibraries.get(userId)!.add(libraryId)
}

export async function canAccessLibrary(library: Library): Promise<boolean> {
  if (!library.isPrivate) {
    return true
  }

  return await isLibraryUnlocked(library.id)
}