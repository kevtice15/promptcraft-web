# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptCraft Web is a Next.js 14 application for organizing and managing AI image generation prompts. Users can create libraries, organize prompts into groups, and securely protect sensitive prompt collections with passwords.

## Development Commands

Since this is a new project that hasn't been initialized yet, the following commands will be available once the project is set up:

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma migrate dev  # Create and apply migrations
npx prisma studio    # Open Prisma Studio
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: JWT tokens with jose library, bcrypt for password hashing
- **Database**: PostgreSQL with Prisma schema

## Architecture Overview

### Authentication System
- JWT-based authentication with httpOnly cookies
- Session management in `lib/auth.ts`
- Helper functions: `createSession()`, `getSession()`, `deleteSession()`, `requireAuth()`
- 7-day token expiration

### Library Privacy System
- In-memory Map for session-based library unlocking in `lib/library-access.ts`
- Functions: `isLibraryUnlocked()`, `unlockLibrary()`, `lockLibrary()`, `requireLibraryAccess()`
- Password verification using bcrypt.compare()

### Database Schema
Four main models with cascading relationships:
- **User**: Basic user account with email/password
- **Library**: Top-level containers with optional password protection
- **Group**: Organization units within libraries
- **Prompt**: Individual prompts with generation parameters

### Project Structure
```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Main application pages
│   └── api/              # API routes organized by resource
├── components/
│   ├── ui/               # Reusable UI primitives
│   ├── auth/             # Authentication components
│   ├── library/          # Library management components
│   ├── groups/           # Group management components
│   ├── prompts/          # Prompt management components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
└── types/                # TypeScript type definitions
```

## Key Implementation Patterns

### Component Architecture
- Server Components by default for better performance
- Client Components only when interactive features are needed
- Consistent Tailwind styling across all components
- UI primitives in `components/ui/` for reusability

### API Route Organization
- RESTful routes organized by resource (`/api/libraries`, `/api/groups`, `/api/prompts`)
- Authentication middleware using `requireAuth()`
- Library access control using `requireLibraryAccess()`
- Proper error handling and TypeScript types

### Database Access
- Single Prisma client instance in `lib/prisma.ts`
- Import pattern: `import { prisma } from '@/lib/prisma'`
- All database operations use Prisma for type safety

### Validation
- Input validation in `lib/validations.ts`
- Password minimum 8 characters
- Required fields: library name, group name, positive prompt

## Environment Variables Required

```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key-min-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Development Guidelines

1. **TypeScript First**: All components and functions should be properly typed
2. **Server Components**: Use Server Components by default, Client Components only when needed
3. **Consistent Styling**: Follow Tailwind patterns established in UI primitives
4. **Error Handling**: Implement proper loading states and error messages
5. **Authentication**: Always check authentication and library access in protected routes
6. **Database**: Use Prisma for all database operations with proper error handling

## ✅ Implemented Features

### Authentication System
- ✅ Email/password signup and login
- ✅ JWT-based session management with 7-day expiration
- ✅ Secure logout with session cleanup
- ✅ Protected routes with automatic redirects

### Library Management
- ✅ Create, read, update, delete libraries
- ✅ Color-coded organization with 6 preset colors
- ✅ Password protection for private libraries
- ✅ Session-based unlocking system
- ✅ Library switching and management UI

### Group Management
- ✅ Create, read, update, delete groups within libraries
- ✅ Sort ordering and search functionality
- ✅ Group sidebar with prompt counts
- ✅ Hierarchical organization (Library → Groups → Prompts)

### Prompt Management
- ✅ Full CRUD operations for prompts
- ✅ Comprehensive generation parameters:
  - Positive/negative prompts
  - Steps, CFG Scale, Sampler selection
  - Model selection with presets
  - Seed values with random generation
  - Dimensions with common presets
  - Notes and metadata
- ✅ Expand/collapse prompt cards
- ✅ Copy-to-clipboard functionality (individual + bulk)
- ✅ Favorites system with toggle

### Search & Discovery
- ✅ Full-text search across prompts, notes, and groups
- ✅ Library-wide and group-specific search
- ✅ Favorites filtering
- ✅ Debounced search with 300ms delay
- ✅ Search result highlighting and counts

### User Interface
- ✅ Responsive design for mobile and desktop
- ✅ Clean UI with Tailwind CSS styling
- ✅ Loading states and error handling
- ✅ Modal dialogs for all forms
- ✅ Toast notifications for copy actions
- ✅ Consistent component architecture

## 🚀 Ready for Production

The application is feature-complete and ready for deployment. All core functionality has been implemented with proper error handling, validation, and user experience considerations.

Refer to README.md for setup instructions and DEVELOPMENT_PLAN.md for detailed architectural specifications.