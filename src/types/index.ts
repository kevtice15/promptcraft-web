import { User, Library, Group, Prompt, ImageReference } from '@prisma/client'

export type UserWithLibraries = User & {
  libraries: Library[]
}

export type LibraryWithGroups = Library & {
  groups: Group[]
}

export type GroupWithPrompts = Group & {
  prompts: Prompt[]
}

export type PromptWithGroup = Prompt & {
  group: Group
}

export type PromptWithImages = Prompt & {
  images: ImageReference[]
}

export type PromptWithGroupAndImages = Prompt & {
  group: Group
  images: ImageReference[]
}

export interface SessionUser {
  id: string
  email: string
  name?: string
}

export interface CreateLibraryData {
  name: string
  description?: string
  color: string
  isPrivate: boolean
  password?: string
  passwordHint?: string
}

export interface CreateGroupData {
  name: string
  description?: string
  libraryId: string
}

export interface CreatePromptData {
  positivePrompt: string
  negativePrompt?: string
  notes?: string
  steps: number
  cfgScale: number
  sampler: string
  model: string
  seed?: bigint
  width: number
  height: number
  groupId: string
}

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  name?: string
}

export interface UnlockLibraryData {
  libraryId: string
  password: string
}