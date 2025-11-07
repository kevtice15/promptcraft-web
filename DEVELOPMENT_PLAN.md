PromptCraft Web MVP - Development Plan
🎯 Project Overview
Build a Next.js 14 web application for organizing and managing AI image generation prompts. Users can create libraries, organize prompts into groups, and securely protect sensitive prompt collections with passwords.

📋 MVP Feature Set
Core Features

1. Authentication: Email/password signup, login, logout with JWT sessions
1. Library Management: Create, list, switch, delete libraries with optional password protection
1. Group Management: Create, list, rename, delete groups within libraries
1. Prompt Management: Create, view, edit, copy, favorite, delete prompts with generation parameters
1. Search: Simple text search across prompts in current library
1. Privacy: Password-protect private libraries, session-based unlocking



Frontend:
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS

Backend:
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- bcrypt (password hashing)
- jose (JWT tokens)
```

---

## 📁 Project Structure
```
promptcraft-web/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── library/[libraryId]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── libraries/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── [id]/unlock/route.ts
│   │   │   ├── groups/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── prompts/
│   │   │       ├── route.ts
│   │   │       ├── [id]/route.ts
│   │   │       └── search/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   └── modal.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── signup-form.tsx
│   │   ├── library/
│   │   │   ├── library-picker.tsx
│   │   │   ├── library-card.tsx
│   │   │   ├── create-library-modal.tsx
│   │   │   ├── unlock-library-modal.tsx
│   │   │   └── library-header.tsx
│   │   ├── groups/
│   │   │   ├── groups-sidebar.tsx
│   │   │   ├── group-item.tsx
│   │   │   ├── create-group-modal.tsx
│   │   │   └── group-header.tsx
│   │   ├── prompts/
│   │   │   ├── prompt-list.tsx
│   │   │   ├── prompt-card.tsx
│   │   │   ├── create-prompt-modal.tsx
│   │   │   ├── edit-prompt-modal.tsx
│   │   │   └── prompt-search.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── main-layout.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── library-access.ts
│   │   ├── validations.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js



generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  libraries Library[]
}

model Library {
  id           String   @id @default(cuid())
  name         String
  description  String?
  color        String   @default("#3b82f6")
  isPrivate    Boolean  @default(false)
  passwordHash String?
  passwordHint String?
  userId       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  groups Group[]
  
  @@index([userId])
  @@index([isPrivate])
}

model Group {
  id          String   @id @default(cuid())
  name        String
  description String?
  libraryId   String
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  library Library  @relation(fields: [libraryId], references: [id], onDelete: Cascade)
  prompts Prompt[]
  
  @@index([libraryId])
}

model Prompt {
  id             String   @id @default(cuid())
  positivePrompt String   @db.Text
  negativePrompt String?  @db.Text
  notes          String?  @db.Text
  isFavorite     Boolean  @default(false)
  steps          Int      @default(20)
  cfgScale       Float    @default(7.0)
  sampler        String   @default("Euler a")
  model          String   @default("SD 1.5")
  seed           BigInt?
  width          Int      @default(512)
  height         Int      @default(512)
  groupId        String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@index([groupId])
  @@index([isFavorite])
  @@index([createdAt])
}
```

---

## 🎨 Component Design Guidelines

### UI Primitives (src/components/ui/)

All base components should use Tailwind CSS with consistent styling:

**Button**: Variants (primary, secondary, ghost, destructive), sizes (sm, md, lg), loading states
**Card**: White background, rounded-lg, border, hover states for clickable cards
**Input/Textarea**: Consistent border, focus rings, error states, labels
**Badge**: Small colored labels for status/counts
**Modal**: Fixed overlay with backdrop, centered content, max-width constraints

### Authentication Components

**login-form**: Email + password fields, error messages, "Sign up" link
**signup-form**: Name (optional), email, password, confirm password with validation

### Library Components

**library-picker**: Grid of library cards, "Create New" button, shows lock icons on private libraries
**library-card**: Displays name, description, color indicator, group count, lock icon if private
**create-library-modal**: Form with name, description, color picker (6 preset colors), privacy toggle, password fields (if private)
**unlock-library-modal**: Shows library name, password input, password hint display, error handling
**library-header**: Current library name, picker dropdown, lock button (if applicable)

### Group Components

**groups-sidebar**: Vertical list of groups, search input, "Create Group" button, shows prompt counts
**group-item**: Group name, prompt count badge, active state highlight, context menu for actions
**create-group-modal**: Simple form with name and optional description
**group-header**: Group name (inline editable), prompt count, "New Prompt" button, actions menu

### Prompt Components

**prompt-list**: Displays prompts in reverse chronological order, handles empty state
**prompt-card**: 
- Collapsed view: 2-line prompt preview, model, steps, CFG
- Expanded view: Full positive/negative prompts, all parameters, notes
- Actions: Copy buttons (with "Copied!" feedback), Edit, Favorite toggle, Delete
**create-prompt-modal**: Form with positive prompt (required, textarea, monospace), negative prompt (optional), generation parameters (steps, CFG, sampler, model, seed, dimensions), notes
**edit-prompt-modal**: Same as create but pre-filled with existing data
**prompt-search**: Search input with debounce (300ms), shows results inline

### Layout Components

**main-layout**: Three-section layout (header, sidebar, main content), responsive stacking on mobile
**header**: App branding, library picker, user menu with logout
**sidebar**: Contains groups sidebar, 256px width, white background

---

## 🔧 Key Implementation Details

### Authentication (lib/auth.ts)
- Use `jose` library for JWT signing/verification
- Store JWT in httpOnly cookie named "session"
- 7-day expiration
- Helper functions: createSession(), getSession(), deleteSession(), requireAuth()

### Library Privacy (lib/library-access.ts)
- In-memory Map storing unlocked libraries per user session
- Functions: isLibraryUnlocked(), unlockLibrary(), lockLibrary(), requireLibraryAccess()
- Password verification using bcrypt.compare()
- Clear unlocked libraries on logout

### Database (lib/prisma.ts)
- Singleton Prisma client instance
- Import pattern: `import { prisma } from '@/lib/prisma'`

### Validation (lib/validations.ts)
- Password: minimum 8 characters
- Email: valid email format
- Required fields: library name, group name, positive prompt

---

## 🚀 Development Phases

### Phase 1: Setup & Authentication (Week 1)
1. Initialize Next.js project with TypeScript and Tailwind
2. Setup Prisma with PostgreSQL
3. Create database schema and run migrations
4. Build authentication system (signup, login, logout)
5. Create UI primitive components (Button, Input, Card, Modal)
6. Implement auth pages and forms

### Phase 2: Library & Group Management (Week 2)
1. Build library CRUD API routes
2. Implement library privacy (password protection, unlock flow)
3. Create library components (picker, cards, modals)
4. Build group CRUD API routes
5. Create groups sidebar and group components
6. Implement main dashboard layout

### Phase 3: Prompt Management & Search (Week 3)
1. Build prompt CRUD API routes
2. Create prompt components (list, cards, modals)
3. Implement copy-to-clipboard functionality
4. Build search API and component
5. Add favorite toggle functionality
6. Polish UI and add loading/error states
7. Deploy to Vercel

---

## 📝 Environment Variables
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key-min-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🎯 Success Criteria

- ✅ Users can sign up and log in
- ✅ Users can create and manage multiple libraries
- ✅ Users can password-protect private libraries
- ✅ Users can organize prompts into groups
- ✅ Users can create, edit, copy, and delete prompts
- ✅ Users can search prompts within a library
- ✅ All data persists in PostgreSQL
- ✅ Responsive design works on desktop and mobile
- ✅ Clean, modern UI with consistent styling

---

## 💡 Design Principles

1. **Simplicity First**: Focus on core workflow, avoid feature creep
2. **Clean UI**: White backgrounds, ample spacing, clear typography
3. **Immediate Feedback**: Loading states, success messages, error handling
4. **Keyboard Friendly**: Forms support Enter to submit, Escape to cancel
5. **Mobile Responsive**: Stack layout on small screens, maintain usability
6. **Performance**: Server components where possible, client components only when needed
7. **Type Safety**: Leverage TypeScript throughout, validate all inputs

---

# Initial Prompt for Claude Code
```
I want to build PromptCraft Web, a Next.js application for managing AI image generation prompts. 

Please follow the development plan in DEVELOPMENT_PLAN.md:

1. First, initialize a new Next.js 14 project with TypeScript, Tailwind CSS, and the App Router
2. Set up Prisma with the database schema from the plan
3. Create the project structure as outlined
4. Start with Phase 1: Authentication system
5. Build each component following the design guidelines in the plan
6. Implement all API routes with proper error handling
7. Ensure TypeScript types are properly defined

Use the database schema, component specifications, and implementation details from DEVELOPMENT_PLAN.md as your reference.

Focus on:
- Clean, readable code with proper TypeScript types
- Consistent Tailwind styling across components
- Proper error handling and loading states
- Server Components by default, Client Components only when needed
- Following Next.js 14 best practices

Let's start with project initialization and the authentication system.