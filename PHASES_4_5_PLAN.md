PromptCraft Web - Phases 4 & 5 Development Plan
🎯 Overview
This document outlines the implementation plan for Phase 4: Enhanced Features and Phase 5: Collaboration Features of PromptCraft Web. These phases transform the MVP into a power-user tool with image support, templates, advanced search, and team collaboration capabilities.

📊 Phase 4: Enhanced Features (Weeks 4-6)
Objective: Add power-user features that differentiate PromptCraft from basic note-taking apps

4.1 Image Prompt Support (Week 4)
Goals

Users can upload reference images to prompts
Support multiple image types (Reference, Style, Composition, etc.)
Display images in prompt cards
Dedicated image gallery view
Efficient storage and thumbnail generation

Database Schema Changes
Add new ImageReference model to prisma/schema.prisma:
prismamodel ImageReference {
  id               String   @id @default(cuid())
  promptId         String
  fileName         String
  originalFileName String
  type             String   // reference, style, composition, lighting, mood, color
  description      String?
  weight           Float    @default(1.0)
  fileSize         Int
  width            Int
  height           Int
  thumbnailUrl     String
  originalUrl      String
  uploadedBy       String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  
  @@index([promptId])
  @@index([type])
}
Update Prompt model to include:
prismamodel Prompt {
  // ... existing fields
  images ImageReference[]
}
File Storage Setup
Recommended: Vercel Blob Storage
bashnpm install @vercel/blob
Add to .env.local:
bashBLOB_READ_WRITE_TOKEN="vercel_blob_..."
Validation Rules:

Max file size: 10MB per image
Allowed formats: PNG, JPG, JPEG, WebP, AVIF
Min dimensions: 64x64px
Max dimensions: 8192x8192px
Max 5 images per prompt

Image Type Configuration
typescript// Reference for implementation
const IMAGE_TYPES = {
  reference: { label: 'Reference', maxCount: 1, suggestedWeight: 1.0 },
  style: { label: 'Style', maxCount: 3, suggestedWeight: 0.75 },
  composition: { label: 'Composition', maxCount: 3, suggestedWeight: 0.6 },
  lighting: { label: 'Lighting', maxCount: 3, suggestedWeight: 0.5 },
  mood: { label: 'Mood', maxCount: 3, suggestedWeight: 0.5 },
  color: { label: 'Color Palette', maxCount: 3, suggestedWeight: 0.4 }
};
New API Routes
Create the following routes:

/api/images (POST) - Upload image(s)

Accept multipart/form-data
Validate file size, type, dimensions
Generate thumbnail (200x200px)
Upload both original and thumbnail to blob storage
Create ImageReference record
Return image metadata


/api/images (GET) - List images for a prompt

Query param: promptId
Return array of ImageReference records


/api/images/[id] (GET) - Get image metadata

Return single ImageReference record


/api/images/[id] (PUT) - Update image metadata

Allow editing: description, weight, type
Validate weight range (0.1 - 2.0)


/api/images/[id] (DELETE) - Delete image

Delete from blob storage
Delete ImageReference record
Check user permissions



New Utility File
Create src/lib/image-storage.ts with functions:

uploadImage(file: File, promptId: string): Promise<ImageReference>
generateThumbnail(file: File, maxSize: 200): Promise<Blob>
deleteImage(imageId: string): Promise<void>
validateImage(file: File): { valid: boolean, error?: string }

New Components to Build
All components in src/components/images/:

image-upload-zone.tsx (Client Component)

Drag-and-drop area with visual feedback
Click to open file picker
Multiple file upload (up to 5 images total per prompt)
Show upload progress per file
Display thumbnails after upload
Props: promptId, existingImageCount, onUploadComplete, maxImages


image-type-selector.tsx (Client Component)

Dropdown with all 6 image types
Show description for each type
Disable types that have reached maxCount
Props: value, onChange, disabled


image-thumbnail.tsx (Client Component)

Display image thumbnail (80x80px in cards, configurable size)
Show type badge overlay
Show weight if not 1.0
Hover actions: Edit, Delete
Click to open lightbox
Props: image, onEdit, onDelete, size


image-lightbox.tsx (Client Component)

Full-screen overlay with backdrop
Display full-size image
Previous/Next navigation (arrow keys and buttons)
Show metadata overlay (type, weight, description)
Zoom controls
Close on Escape or backdrop click
Props: images, initialIndex, isOpen, onClose


edit-image-modal.tsx (Client Component)

Modal form to edit image metadata
Fields: Type (dropdown), Weight (slider 0.1-2.0), Description (textarea)
Save/Cancel buttons
Props: image, isOpen, onClose, onSave


image-gallery.tsx (Client Component)

Responsive grid view (2-6 columns)
Filter by type, date range
Search by description
Sort options (date, size, type)
Click image to see associated prompt
Multi-select for bulk delete
Props: libraryId



Updates to Existing Components
prompt-card.tsx:

In collapsed view: Show image count badge (e.g., "🖼️ 3")
In expanded view: Display horizontal scrollable row of image thumbnails
Add "Add Images" button in expanded view
Click thumbnail to open lightbox

create-prompt-modal.tsx & edit-prompt-modal.tsx:

Add image upload section at bottom of form
Use image-upload-zone component
Display existing images with edit/delete options
Show image count (e.g., "3/5 images")

Navigation:

Add "Images" link to main navigation
Route to /library/[libraryId]/images showing image-gallery

Implementation Tasks

Run Prisma migration for ImageReference model
Install and configure Vercel Blob storage
Create image storage utility functions
Build all image API routes with validation
Create all 6 image components
Update prompt-card component
Update create/edit prompt modals
Add images route to navigation
Test upload/delete/edit flows
Test with various image formats and sizes
Add error handling and loading states
Optimize thumbnail generation performance


4.2 Template/Wildcard Detection (Week 5)
Goals

Automatically detect wildcard patterns in prompts
Visual indicators for template prompts
Filter prompts by template status
Optional syntax highlighting

Wildcard Patterns to Detect
Five wildcard types:

{variable} - Curly braces for variables
[option1|option2] - Square brackets for options
((emphasis)) - Double parentheses for emphasis
<lora:model_name> - LoRA references
$variable - Dollar sign variables

Database Schema Changes
Update Prompt model in prisma/schema.prisma:
prismamodel Prompt {
  // ... existing fields
  hasTemplate      Boolean  @default(false)
  wildcardCount    Int      @default(0)
  templateMetadata Json?
  
  @@index([hasTemplate])
}
templateMetadata JSON structure:
json{
  "wildcards": [
    { "type": "curlyBraces", "text": "{variable}", "position": 10 },
    { "type": "squareBrackets", "text": "[opt1|opt2]", "position": 45 }
  ],
  "complexity": "moderate",
  "categories": ["variable", "options"]
}
Complexity calculation:

simple: 1-2 wildcards
moderate: 3-5 wildcards
complex: 6+ wildcards

New Utility File
Create src/lib/wildcard-detector.ts with:
typescriptinterface WildcardMatch {
  type: string;
  text: string;
  position: number;
  length: number;
}

interface TemplateAnalysis {
  hasTemplate: boolean;
  wildcardCount: number;
  wildcards: WildcardMatch[];
  complexity: 'none' | 'simple' | 'moderate' | 'complex';
  categories: string[];
}

function analyzeTemplate(text: string): TemplateAnalysis
Implementation: Use regex to detect all five patterns, count matches, calculate complexity.
New Components to Build
All components in src/components/templates/:

template-badge.tsx

Small badge showing "✨ 3 wildcards" or "Template (moderate)"
Color coded by complexity: blue (simple), purple (moderate), pink (complex)
Props: wildcardCount, complexity, size


template-analysis-panel.tsx (Optional - can defer to later)

Expandable panel showing template details
List detected wildcards with types
Show complexity explanation
Props: analysis



Updates to Existing Components
prompt-card.tsx:

Show template-badge next to favorite star when hasTemplate is true
Badge appears in both collapsed and expanded views

prompt-list.tsx:

Add filter toggle button: "Templates Only" (funnel icon)
When active, filter to only show prompts where hasTemplate=true
Show active filter indicator

create-prompt-modal.tsx & edit-prompt-modal.tsx:

Analyze prompt text for wildcards as user types (debounced)
Show live wildcard count below textarea
Optionally highlight wildcards in different colors (can use simple CSS classes)

API route updates:
/api/prompts (POST) and /api/prompts/[id] (PUT):

Before saving, run analyzeTemplate() on positivePrompt
Store hasTemplate, wildcardCount, and templateMetadata

New API Route (Optional)
/api/prompts/templates (GET):

List all templates in current library
Return prompts with hasTemplate=true
Include template analysis in response

Implementation Tasks

Run Prisma migration for template fields
Create wildcard-detector.ts utility with regex patterns
Build template-badge component
Update prompt-card to show template badge
Add template filter to prompt-list
Update prompt API routes to analyze templates on save
Add live template detection to create/edit modals
Test with various wildcard patterns
Verify complexity calculation accuracy
Add template filter to search functionality


4.3 Advanced Search & Filtering (Week 6)
Goals

Multi-faceted search with complex criteria
Save frequently-used searches
Filter by parameters, dates, templates, images
Fast full-text search

Database Schema Changes
Add SavedSearch model to prisma/schema.prisma:
prismamodel SavedSearch {
  id        String   @id @default(cuid())
  name      String
  userId    String
  libraryId String?  // null = search all libraries
  filters   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
Add full-text search to Prompt model (PostgreSQL):
Run this SQL after migration:
sqlALTER TABLE "Prompt" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', "positivePrompt"), 'A') ||
    setweight(to_tsvector('english', coalesce("negativePrompt", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("notes", '')), 'C')
  ) STORED;

CREATE INDEX prompt_search_idx ON "Prompt" USING GIN(search_vector);
Filter Types
Create src/types/search.ts:
typescriptinterface SearchFilters {
  // Text
  query?: string;
  
  // Boolean
  favoritesOnly?: boolean;
  templatesOnly?: boolean;
  hasImages?: boolean;
  hasNegativePrompt?: boolean;
  hasNotes?: boolean;
  
  // Date ranges
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  
  // Parameters
  models?: string[];
  samplers?: string[];
  stepsMin?: number;
  stepsMax?: number;
  cfgMin?: number;
  cfgMax?: number;
  
  // Images
  imageTypes?: string[];
  imageCountMin?: number;
  imageCountMax?: number;
  
  // Templates
  wildcardCountMin?: number;
  wildcardCountMax?: number;
  templateComplexity?: ('simple' | 'moderate' | 'complex')[];
  
  // Sorting
  sortBy?: 'createdAt' | 'modifiedAt' | 'positivePrompt' | 'wildcardCount';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  prompt: Prompt & { group: { name: string } };
  highlights?: {
    positivePrompt?: string;
    negativePrompt?: string;
    notes?: string;
  };
  relevanceScore?: number;
}
New API Routes

/api/search/advanced (POST)

Accept SearchFilters in body
Accept pagination params: page, pageSize
Build complex Prisma query with all filters
Use full-text search for query with @@ operator
Return paginated results with total count
Include highlights (wrap matches in <mark> tags)


/api/search/saved (GET, POST)

GET: List user's saved searches
POST: Create new saved search


/api/search/saved/[id] (GET, PUT, DELETE)

GET: Get saved search details
PUT: Update saved search
DELETE: Delete saved search


/api/search/suggestions (GET)

Return available models, samplers for dropdown filters
Calculate from existing prompts in library



New Utility File
Create src/lib/advanced-search.ts:
Key function:
typescriptasync function executeAdvancedSearch(
  userId: string,
  libraryId: string,
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<{ results: SearchResult[], total: number }>
Implementation notes:

Build Prisma where clause from filters
Use search_vector @@ plainto_tsquery(query) for text search
Apply all range filters (steps, cfg, dates)
Join with groups and images as needed
Order by sortBy and sortOrder
Use Prisma skip and take for pagination
Generate highlights by finding query matches in text

New Components to Build
All components in src/components/search/:

advanced-search-modal.tsx (Client Component)

Full-screen or large modal with filters sidebar
Left sidebar: All filter controls
Right main area: Search results
Props: libraryId, isOpen, onClose


search-filters-panel.tsx (Client Component)

Contains all filter input controls
Organized in collapsible sections: Text, Dates, Parameters, Images, Templates
"Apply Filters" button
"Clear All" button
"Save Search" button
Props: filters, onChange, onApply, onClear, onSave


search-results-list.tsx (Client Component)

Display search results with highlights
Show relevance score if available
Click result to navigate to prompt
Pagination controls at bottom
Empty state when no results
Props: results, total, page, pageSize, onPageChange


search-result-card.tsx (Client Component)

Compact card showing prompt preview
Highlight matched text with <mark> tags
Show group name, date, template badge
Click to navigate to prompt in library
Props: result


saved-searches-dropdown.tsx (Client Component)

Dropdown menu of saved searches
Click to apply saved search
Edit/delete options per saved search
Props: savedSearches, onSelect, onEdit, onDelete


date-range-picker.tsx (Client Component - Reusable)

Date picker with "From" and "To" fields
Preset buttons: Today, Last 7 days, Last 30 days, Last 90 days
Props: from, to, onChange


parameter-range-slider.tsx (Client Component - Reusable)

Dual-handle slider for min/max ranges
Numeric inputs for precise values
Props: min, max, value, onChange, label



Updates to Existing Components
Navigation:

Update search icon/button to open advanced-search-modal
Keep simple search in header as quick access
Advanced search button opens full modal

prompt-search.tsx:

Keep as simple search for quick queries
Add "Advanced" button that opens advanced-search-modal

Implementation Tasks

Run Prisma migration for SavedSearch model
Run SQL commands to add full-text search column and index
Create search types file
Build advanced-search.ts utility with query builder
Create all advanced search API routes
Build all 7 search components
Implement filter logic for each filter type
Add text highlighting for search matches
Implement pagination
Build saved search functionality
Test with various filter combinations
Optimize search performance for large datasets
Add loading states and empty states


📊 Phase 5: Collaboration Features (Weeks 7-9)
Objective: Enable team collaboration and multi-user workflows

5.1 Library Sharing (Week 7)
Goals

Share libraries with other users
Set permissions (read-only, edit, admin)
Invite users by email
Track who has access
Activity feed showing changes

Database Schema Changes
Add to prisma/schema.prisma:
prismamodel LibraryShare {
  id         String   @id @default(cuid())
  libraryId  String
  userId     String
  permission String   // read, write, admin
  invitedBy  String
  createdAt  DateTime @default(now())
  acceptedAt DateTime?
  
  library   Library @relation(fields: [libraryId], references: [id], onDelete: Cascade)
  user      User    @relation("SharedWith", fields: [userId], references: [id], onDelete: Cascade)
  inviter   User    @relation("SharedBy", fields: [invitedBy], references: [id])
  
  @@unique([libraryId, userId])
  @@index([userId])
  @@index([libraryId])
}

model LibraryInvite {
  id         String   @id @default(cuid())
  libraryId  String
  email      String
  permission String
  invitedBy  String
  token      String   @unique
  expiresAt  DateTime
  acceptedAt DateTime?
  createdAt  DateTime @default(now())
  
  library Library @relation(fields: [libraryId], references: [id], onDelete: Cascade)
  inviter User    @relation(fields: [invitedBy], references: [id])
  
  @@index([email])
  @@index([libraryId])
}

model Activity {
  id         String   @id @default(cuid())
  libraryId  String
  userId     String
  action     String   // created_prompt, edited_prompt, deleted_prompt, etc.
  entityType String   // prompt, group, library
  entityId   String
  metadata   Json?
  createdAt  DateTime @default(now())
  
  library Library @relation(fields: [libraryId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])
  
  @@index([libraryId, createdAt])
  @@index([userId])
}
Update Library model:
prismamodel Library {
  // ... existing fields
  ownerId    String  // rename userId to ownerId for clarity
  shares     LibraryShare[]
  invites    LibraryInvite[]
  activities Activity[]
}
Permission Levels
typescriptenum LibraryPermission {
  READ = 'read',    // View only
  WRITE = 'write',  // View + edit prompts/groups
  ADMIN = 'admin'   // Full control (share, delete)
}
New API Routes

/api/libraries/[id]/share (POST)

Invite user by email to library
Create LibraryInvite record with token
Send email invitation with accept link
Body: { email, permission }


/api/libraries/[id]/shares (GET)

List all users with access to library
Include invites (pending)
Return user info and permissions


/api/libraries/[id]/shares/[shareId] (PUT, DELETE)

PUT: Update permission level
DELETE: Remove user access


/api/invites/accept/[token] (POST)

Accept library invitation
Create LibraryShare record
Mark invite as accepted
Redirect to library


/api/libraries/[id]/activity (GET)

Get activity feed for library
Paginated list of Activity records
Include user info (name, email)



New Utility Files
src/lib/permissions.ts:
typescriptasync function checkLibraryPermission(
  userId: string,
  libraryId: string,
  requiredPermission: LibraryPermission
): Promise<boolean>

async function getUserLibraryPermission(
  userId: string,
  libraryId: string
): Promise<LibraryPermission | null>

// Helper to use in API routes
async function requireLibraryPermission(
  userId: string,
  libraryId: string,
  permission: LibraryPermission
): Promise<void> // throws if no access
src/lib/activity.ts:
typescriptasync function logActivity(
  libraryId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
): Promise<void>
Email Service Setup
Choose email provider:

Resend (recommended, simple API)
SendGrid
AWS SES

Install:
bashnpm install resend
Add to .env.local:
bashRESEND_API_KEY="re_..."
FROM_EMAIL="noreply@promptcraft.app"
APP_URL="https://promptcraft.app"
Create src/lib/email.ts:
typescriptasync function sendLibraryInvitation(
  to: string,
  inviterName: string,
  libraryName: string,
  acceptUrl: string
): Promise<void>
New Components to Build
All components in src/components/sharing/:

share-library-modal.tsx (Client Component)

Modal with invite form
Email input and permission selector
List of current shares
Pending invites section
Props: library, isOpen, onClose


share-list.tsx (Client Component)

List of users with access
Show name, email, permission, and "Invited by"
Actions: Change permission, Remove access (if admin)
Props: shares, currentUserId, canManage


pending-invites-list.tsx (Client Component)

List of pending invitations
Show email, permission, invited date
Actions: Resend email, Revoke invite
Props: invites, onResend, onRevoke


activity-feed.tsx (Client Component)

Timeline/list of recent activities
Show user avatar, action description, timestamp
Filter by action type
Props: libraryId


activity-item.tsx (Client Component)

Single activity entry
Icon based on action type
Human-readable description (e.g., "John created prompt 'Sunset scene'")
Link to entity if still exists
Props: activity


shared-library-indicator.tsx

Badge/icon showing library is shared
Shows number of collaborators
Click to open share modal
Props: shareCount, onClick



Updates to Existing Components
library-header.tsx:

Add "Share" button (visible to owner and admins)
Show shared-library-indicator if library has shares
Disable certain actions if user doesn't have permission

library-picker.tsx:

Add section for "Shared with me" libraries
Distinguish owned vs shared libraries visually
Show permission level badge on shared libraries

All prompt/group components:

Check permissions before showing edit/delete buttons
Disable actions if user only has read permission
Show "Read only" indicator if applicable

API route updates:

Update all library/group/prompt API routes to check permissions
Use requireLibraryPermission() at start of each route
Log activities for create/update/delete actions

Implementation Tasks

Run Prisma migrations for sharing tables
Set up email service (Resend)
Create permissions utility file
Create activity logging utility
Create email templates
Build all sharing API routes
Create all 6 sharing components
Update library-header with share button
Update library-picker to show shared libraries
Add permission checks to all API routes
Add activity logging to all mutations
Test invitation flow end-to-end
Test permission enforcement
Add email notifications for shared activities (optional)


5.2 Real-Time Updates (Week 8)
Goals

Collaborators see changes in real-time
"User is editing..." presence indicators
Optimistic UI updates
Conflict resolution for simultaneous edits

Technology Setup
Option A: Pusher (Recommended - easier setup)
bashnpm install pusher pusher-js
Add to .env.local:
bashPUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="us2"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
Option B: Socket.io (More control)
bashnpm install socket.io socket.io-client
Event Types
typescript// src/types/realtime.ts

type RealtimeEvent =
  | { type: 'prompt.created'; data: Prompt }
  | { type: 'prompt.updated'; data: Prompt }
  | { type: 'prompt.deleted'; data: { promptId: string } }
  | { type: 'group.created'; data: Group }
  | { type: 'group.updated'; data: Group }
  | { type: 'group.deleted'; data: { groupId: string } }
  | { type: 'user.presence'; data: { userId: string; status: 'online' | 'offline' } }
  | { type: 'user.editing'; data: { userId: string; entityId: string; entityType: string } };
New Utility Files
src/lib/realtime-server.ts (Server-side):
typescript// Initialize Pusher server instance
// Functions to broadcast events:
async function broadcastToLibrary(libraryId: string, event: RealtimeEvent): Promise<void>
async function broadcastPresence(libraryId: string, userId: string, status: string): Promise<void>
src/lib/realtime-client.ts (Client-side):
typescript// Initialize Pusher client
// Subscribe to library channel
// Handle incoming events
function useLibraryRealtime(libraryId: string): {
  subscribe: () => void;
  unsubscribe: () => void;
  broadcastPresence: (status: string) => void;
}
Custom Hooks
Create src/hooks/use-realtime-sync.ts:
typescriptfunction useRealtimeSync(libraryId: string) {
  // Subscribe to realtime events for library
  // Update local state when events received
  // Handle presence updates
  // Broadcast user presence on mount/unmount
}
Create src/hooks/use-editing-presence.ts:
typescriptfunction useEditingPresence(entityId: string, entityType: string) {
  // Broadcast that user is editing this entity
  // Listen for other users editing same entity
  // Return list of users currently editing
  // Clear presence on unmount or after inactivity
}
Updates to API Routes
All mutation routes (POST, PUT, DELETE) should broadcast events:
Example for /api/prompts (POST):
typescript// After creating prompt in database
await broadcastToLibrary(libraryId, {
  type: 'prompt.created',
  data: newPrompt
});
Do this for:

Prompt create/update/delete
Group create/update/delete
Image upload/delete

New Components to Build

realtime-provider.tsx

Context provider wrapping app
Manages realtime connection
Provides hooks to children
Props: children


presence-avatars.tsx

Shows avatars of online collaborators
Hover to see names
Max 5 visible, "+3 more" indicator
Props: libraryId


editing-indicator.tsx

Shows "John is editing this prompt..." banner
Appears above prompt card when someone else editing
Props: entityId, entityType


sync-status-indicator.tsx

Small indicator showing connection status
Green dot = connected, Gray = disconnected
Props: none (reads from context)



Updates to Existing Components
main-layout.tsx:

Wrap with realtime-provider
Add sync-status-indicator to header

library-header.tsx:

Add presence-avatars showing online collaborators

**`prompt-card.tsx`:**

Add useEditingPresence hook
Show editing-indicator if someone else is editing
Disable edit button if someone else is editing
Optimistic updates: Update UI immediately, revert on error

edit-prompt-modal.tsx:

Broadcast editing presence on open
Clear editing presence on close
Show warning if someone else starts editing same prompt
Auto-refresh if changes detected from another user

All list views (prompt-list, groups-sidebar):

Use useRealtimeSync hook
Automatically add new items when created by others
Update items when edited by others
Remove items when deleted by others
Animate changes (fade in new items, pulse updated items)

Conflict Resolution Strategy
Last-Write-Wins with Warnings:

When user opens edit modal, record current version timestamp
Before saving, check if prompt was modified after they opened it
If modified by someone else, show warning dialog:

"This prompt was modified by [User] while you were editing"
Options: "Overwrite their changes" or "Discard my changes"


User chooses how to resolve conflict

Implementation in edit-prompt-modal.tsx:
typescriptconst [conflictDetected, setConflictDetected] = useState(false);
const [conflictingVersion, setConflictingVersion] = useState(null);

// On save, check updatedAt timestamp
// If newer than when we loaded, show conflict dialog
Implementation Tasks

Set up Pusher account and get credentials
Install Pusher packages
Create realtime utility files (server and client)
Create custom hooks (useRealtimeSync, useEditingPresence)
Build realtime-provider component
Build presence-avatars component
Build editing-indicator component
Build sync-status-indicator component
Update all API routes to broadcast events
Add useRealtimeSync to list views
Add editing presence to edit modals
Implement conflict resolution UI
Test with multiple users simultaneously
Test connection drop and reconnection
Add presence cleanup on disconnect


5.3 Version History & Comments (Week 9)
Goals

Track all changes to prompts
View change history (who changed what)
Compare versions with diff view
Restore previous versions
Comment on prompts
Mention other users in comments

Database Schema Changes
Add to prisma/schema.prisma:
prismamodel PromptVersion {
  id             String   @id @default(cuid())
  promptId       String
  versionNumber  Int
  positivePrompt String   @db.Text
  negativePrompt String?  @db.Text
  parameters     Json
  notes          String?  @db.Text
  changedBy      String
  changeMessage  String?  // Optional commit message
  createdAt      DateTime @default(now())
  
  prompt  Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [changedBy], references: [id])
  
  @@index([promptId, versionNumber])
  @@index([changedBy])
}

model PromptComment {
  id        String   @id @default(cuid())
  promptId  String
  userId    String
  content   String   @db.Text
  mentions  String[] // Array of mentioned user IDs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])
  
  @@index([promptId, createdAt])
  @@index([userId])
}

model CommentMention {
  id        String   @id @default(cuid())
  commentId String
  userId    String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])
  
  @@index([userId, read])
}
Update Prompt model:
prismamodel Prompt {
  // ... existing fields
  currentVersion Int       @default(1)
  versions       PromptVersion[]
  comments       PromptComment[]
}
Versioning Strategy
Auto-versioning on every save:

When prompt is updated, create PromptVersion record with all fields
Increment currentVersion number
Store who made the change (changedBy)
Optional: Allow user to add change message

Version retention:

Keep all versions (users may want full history)
Optional: Add admin setting to limit version retention (e.g., last 50 versions)

New API Routes

/api/prompts/[id]/versions (GET)

List all versions for a prompt
Include user info (name, email)
Paginated (newest first)
Return: version number, timestamp, changed by, change message


/api/prompts/[id]/versions/[versionNumber] (GET)

Get full details of specific version
Return all prompt fields as they were at that version


/api/prompts/[id]/versions/[versionNumber]/restore (POST)

Restore prompt to this version
Creates new version (doesn't delete history)
Requires write permission


/api/prompts/[id]/versions/compare (GET)

Compare two versions side-by-side
Query params: v1, v2 (version numbers)
Return both versions plus computed diff


/api/prompts/[id]/comments (GET, POST)

GET: List all comments for prompt
POST: Create new comment
Parse mentions (@username) and create CommentMention records


/api/prompts/[id]/comments/[commentId] (PUT, DELETE)

PUT: Update comment (only author can update)
DELETE: Delete comment (author or admin)


/api/mentions (GET)

Get all mentions for current user
Filter: unread query param
Return comment with context (prompt info)



New Utility Files
src/lib/version-diff.ts:
typescriptinterface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

function computeTextDiff(
  oldText: string,
  newText: string
): DiffSegment[]

function computePromptDiff(
  oldVersion: PromptVersion,
  newVersion: PromptVersion
): {
  positivePrompt: DiffSegment[];
  negativePrompt: DiffSegment[];
  parameters: { field: string; old: any; new: any }[];
}
Use library like diff or fast-diff for text diffing:
bashnpm install diff
npm install @types/diff --save-dev
src/lib/mentions.ts:
typescriptfunction parseMentions(text: string): string[] {
  // Extract @username mentions from text
  // Return array of usernames
}

async function createMentions(
  commentId: string,
  userIds: string[]
): Promise<void> {
  // Create CommentMention records for each user
}

async function notifyMentions(
  commentId: string,
  userIds: string[]
): Promise<void> {
  // Send notifications (email, realtime) to mentioned users
}
```

### **New Components to Build**

All components in `src/components/version-history/`:

1. **`version-history-panel.tsx`** (Client Component)
   - Sidebar or modal showing version timeline
   - List of versions with: number, user, timestamp, message
   - Click version to view details
   - Compare button (select 2 versions)
   - Restore button
   - Props: `promptId`

2. **`version-timeline-item.tsx`**
   - Single version entry in timeline
   - Shows version number, user avatar, timestamp
   - Change message if provided
   - Actions: View, Compare, Restore
   - Props: `version`, `onView`, `onCompare`, `onRestore`

3. **`version-compare-view.tsx`** (Client Component)
   - Side-by-side comparison of two versions
   - Highlight differences (green=added, red=removed)
   - Show parameter changes in table
   - Option to restore either version
   - Props: `version1`, `version2`, `onRestore`

4. **`version-diff-display.tsx`**
   - Renders diff segments with color coding
   - Inline diff (mixed line) or side-by-side
   - Props: `diff`, `mode`

5. **`restore-version-modal.tsx`**
   - Confirmation dialog before restoring
   - Show summary of what will change
   - Optional: Add restore message
   - Props: `version`, `currentVersion`, `isOpen`, `onConfirm`, `onCancel`

All components in `src/components/comments/`:

6. **`comments-section.tsx`** (Client Component)
   - List of comments for a prompt
   - "Add comment" input at bottom
   - Real-time updates when new comments added
   - Props: `promptId`

7. **`comment-item.tsx`**
   - Single comment display
   - User avatar, name, timestamp
   - Comment text with formatted mentions
   - Edit/delete actions (if author or admin)
   - Props: `comment`, `onEdit`, `onDelete`

8. **`comment-input.tsx`** (Client Component)
   - Textarea for writing comments
   - @mention autocomplete dropdown
   - Character count
   - Submit button
   - Props: `promptId`, `onSubmit`

9. **`mention-autocomplete.tsx`**
   - Dropdown that appears when typing @
   - Shows list of library collaborators
   - Filter as user types
   - Click to insert mention
   - Props: `users`, `query`, `onSelect`

10. **`mentions-dropdown.tsx`**
    - Notification dropdown in header
    - Shows unread mentions
    - Click to navigate to comment
    - Mark as read action
    - Props: none (fetches from API)

### **Updates to Existing Components**

**`prompt-card.tsx` (expanded view):**
- Add "History" button to open version-history-panel
- Add "Comments" section at bottom
- Show comment count badge
- Use comments-section component

**`edit-prompt-modal.tsx`:**
- Add optional "Change message" field
- Passed to API when saving
- Show version history button in header

**`header.tsx`:**
- Add mentions-dropdown (bell icon)
- Show red dot if unread mentions

**API route updates:**

**`/api/prompts/[id]` (PUT):**
- Before updating, create PromptVersion snapshot
- Increment currentVersion
- Store changeMessage if provided
- Log activity
- Broadcast realtime update

### **Implementation Tasks**

1. Run Prisma migrations for version and comment tables
2. Install diff library
3. Create version-diff utility
4. Create mentions utility
5. Build all version history API routes
6. Build all comment API routes
7. Create all 10 version/comment components
8. Update prompt-card with history and comments
9. Update edit modal to create versions
10. Add mentions dropdown to header
11. Test version creation on every save
12. Test version comparison and restoration
13. Test mention parsing and notifications
14. Test comment real-time updates
15. Add email notifications for mentions (optional)

---

## 🚀 Development Strategy

### **Week-by-Week Plan**

**Week 4: Images**
- Days 1-2: Database, storage setup, API routes
- Days 3-4: Upload components and prompt integration
- Day 5: Image gallery and testing

**Week 5: Templates**
- Days 1-2: Wildcard detection utility and API integration
- Days 3-4: Template components and filtering
- Day 5: Testing and polish

**Week 6: Advanced Search**
- Days 1-2: Search infrastructure and API
- Days 3-4: Search UI components
- Day 5: Saved searches and testing

**Week 7: Sharing**
- Days 1-2: Database, permissions, email setup
- Days 3-4: Sharing UI and invite flow
- Day 5: Activity feed and testing

**Week 8: Real-time**
- Days 1-2: Pusher setup and event infrastructure
- Days 3-4: Real-time hooks and presence
- Day 5: Conflict resolution and testing

**Week 9: Version History**
- Days 1-2: Versioning infrastructure
- Days 3-4: History UI and diff view
- Day 5: Comments and mentions

### **Testing Checklist**

For each feature, test:
- [ ] Happy path (feature works as expected)
- [ ] Edge cases (empty states, max limits)
- [ ] Error handling (network errors, invalid input)
- [ ] Permissions (can't access without proper role)
- [ ] Real-time sync (multiple users simultaneously)
- [ ] Mobile responsiveness
- [ ] Loading states and feedback
- [ ] Keyboard navigation
- [ ] Browser compatibility

### **Performance Considerations**

- **Images**: Optimize thumbnail generation, lazy load images
- **Search**: Use database indexes, cache popular searches
- **Real-time**: Throttle events, batch updates
- **Version history**: Paginate versions, compress old versions
- **Comments**: Paginate comments, load on demand

### **Documentation to Create**

After implementation:
- API documentation for all new endpoints
- Component documentation with examples
- User guide for collaboration features
- Admin guide for managing shared libraries
- Troubleshooting guide for real-time issues