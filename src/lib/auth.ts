import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { SessionUser } from '@/types'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_DURATION))
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })

  return token
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return payload.user as SessionUser
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) return null

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function createUser(email: string, password: string, name?: string): Promise<SessionUser> {
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || null,
    }
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined
  }
}