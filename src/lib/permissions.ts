import { prisma } from '@/lib/prisma'

export type Permission = 'read' | 'write' | 'admin'

export interface LibraryPermission {
  permission: Permission
  isOwner: boolean
  canRead: boolean
  canWrite: boolean
  canAdmin: boolean
  canShare: boolean
}

/**
 * Check user's permission level for a library
 */
export async function checkLibraryPermission(
  libraryId: string, 
  userId: string
): Promise<LibraryPermission | null> {
  // First check if user is the owner
  const library = await prisma.library.findFirst({
    where: { 
      id: libraryId,
      ownerId: userId 
    }
  })

  if (library) {
    return {
      permission: 'admin',
      isOwner: true,
      canRead: true,
      canWrite: true,
      canAdmin: true,
      canShare: true
    }
  }

  // Check if user has been granted access via sharing
  const share = await prisma.libraryShare.findFirst({
    where: {
      libraryId,
      userId,
      acceptedAt: { not: null } // Only accepted shares
    }
  })

  if (!share) {
    return null
  }

  const permission = share.permission as Permission
  
  return {
    permission,
    isOwner: false,
    canRead: true,
    canWrite: permission === 'write' || permission === 'admin',
    canAdmin: permission === 'admin',
    canShare: permission === 'admin'
  }
}

/**
 * Require specific permission level for a library
 */
export async function requireLibraryPermission(
  libraryId: string,
  userId: string,
  requiredPermission: Permission
): Promise<LibraryPermission> {
  const userPermission = await checkLibraryPermission(libraryId, userId)
  
  if (!userPermission) {
    throw new Error('Library not found or access denied')
  }

  const permissionHierarchy = { read: 1, write: 2, admin: 3 }
  const userLevel = permissionHierarchy[userPermission.permission]
  const requiredLevel = permissionHierarchy[requiredPermission]

  if (userLevel < requiredLevel) {
    throw new Error('Insufficient permissions')
  }

  return userPermission
}

/**
 * Check if user can access a library (owner or shared)
 */
export async function canAccessLibrary(
  libraryId: string,
  userId: string
): Promise<boolean> {
  const permission = await checkLibraryPermission(libraryId, userId)
  return permission !== null
}

/**
 * Get all libraries accessible to a user (owned + shared)
 */
export async function getAccessibleLibraries(userId: string) {
  const ownedLibraries = await prisma.library.findMany({
    where: { ownerId: userId },
    include: {
      groups: {
        include: {
          _count: { select: { prompts: true } }
        }
      },
      _count: { select: { shares: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  const sharedLibraries = await prisma.library.findMany({
    where: {
      shares: {
        some: {
          userId,
          acceptedAt: { not: null }
        }
      }
    },
    include: {
      groups: {
        include: {
          _count: { select: { prompts: true } }
        }
      },
      owner: {
        select: { name: true, email: true }
      },
      shares: {
        where: { userId },
        select: { permission: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return {
    owned: ownedLibraries,
    shared: sharedLibraries.map(lib => ({
      ...lib,
      permission: lib.shares[0]?.permission || 'read'
    }))
  }
}

/**
 * Get library sharing information
 */
export async function getLibraryShares(libraryId: string, userId: string) {
  // Verify user owns the library or has admin permission
  const permission = await requireLibraryPermission(libraryId, userId, 'admin')
  
  const shares = await prisma.libraryShare.findMany({
    where: { libraryId },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      inviter: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const pendingInvites = await prisma.libraryInvite.findMany({
    where: { 
      libraryId,
      acceptedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      inviter: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return { shares, pendingInvites }
}

/**
 * Create a library share invitation
 */
export async function createLibraryInvite(
  libraryId: string,
  inviterUserId: string,
  email: string,
  permission: Permission
): Promise<string> {
  // Verify inviter has admin permission
  await requireLibraryPermission(libraryId, inviterUserId, 'admin')

  // Check if user already has access
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    const existingShare = await prisma.libraryShare.findFirst({
      where: {
        libraryId,
        userId: existingUser.id
      }
    })

    if (existingShare) {
      throw new Error('User already has access to this library')
    }
  }

  // Check for existing pending invite
  const existingInvite = await prisma.libraryInvite.findFirst({
    where: {
      libraryId,
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() }
    }
  })

  if (existingInvite) {
    throw new Error('Pending invitation already exists for this email')
  }

  // Generate secure token
  const token = crypto.randomUUID() + '-' + Date.now()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.libraryInvite.create({
    data: {
      libraryId,
      email,
      permission,
      invitedBy: inviterUserId,
      token,
      expiresAt
    }
  })

  return token
}

/**
 * Accept a library invitation
 */
export async function acceptLibraryInvite(token: string, userId: string) {
  const invite = await prisma.libraryInvite.findFirst({
    where: {
      token,
      acceptedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      library: true
    }
  })

  if (!invite) {
    throw new Error('Invalid or expired invitation')
  }

  // Get the user's email to verify they're accepting their own invite
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  })

  if (!user || user.email !== invite.email) {
    throw new Error('This invitation is not for your email address')
  }

  // Check if user already has access
  const existingShare = await prisma.libraryShare.findFirst({
    where: {
      libraryId: invite.libraryId,
      userId
    }
  })

  if (existingShare) {
    throw new Error('You already have access to this library')
  }

  // Create the share and mark invite as accepted
  await prisma.$transaction([
    prisma.libraryShare.create({
      data: {
        libraryId: invite.libraryId,
        userId,
        permission: invite.permission,
        invitedBy: invite.invitedBy,
        acceptedAt: new Date()
      }
    }),
    prisma.libraryInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() }
    })
  ])

  return invite.library
}

/**
 * Remove user access to a library
 */
export async function removeLibraryAccess(
  libraryId: string,
  targetUserId: string,
  requestingUserId: string
) {
  // Verify requester has admin permission
  await requireLibraryPermission(libraryId, requestingUserId, 'admin')

  // Can't remove owner access
  const library = await prisma.library.findFirst({
    where: { id: libraryId }
  })

  if (library?.ownerId === targetUserId) {
    throw new Error('Cannot remove owner access')
  }

  // Remove the share
  const deleted = await prisma.libraryShare.deleteMany({
    where: {
      libraryId,
      userId: targetUserId
    }
  })

  if (deleted.count === 0) {
    throw new Error('User does not have access to this library')
  }
}

/**
 * Update user permission for a library
 */
export async function updateLibraryPermission(
  libraryId: string,
  targetUserId: string,
  newPermission: Permission,
  requestingUserId: string
) {
  // Verify requester has admin permission
  await requireLibraryPermission(libraryId, requestingUserId, 'admin')

  // Can't change owner permission
  const library = await prisma.library.findFirst({
    where: { id: libraryId }
  })

  if (library?.ownerId === targetUserId) {
    throw new Error('Cannot change owner permissions')
  }

  // Update the share
  const updated = await prisma.libraryShare.updateMany({
    where: {
      libraryId,
      userId: targetUserId
    },
    data: { permission: newPermission }
  })

  if (updated.count === 0) {
    throw new Error('User does not have access to this library')
  }
}