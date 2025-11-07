# PromptCraft Web

A Next.js web application for organizing and managing AI image generation prompts. Create libraries, organize prompts into groups, and securely protect sensitive prompt collections with passwords.

## ✨ Features

### 🔐 Authentication
- Email/password signup and login
- JWT-based session management
- Secure password hashing with bcrypt

### 📚 Library Management  
- Create multiple prompt libraries
- Color-coded organization
- Password protection for private libraries
- Session-based unlocking system

### 📁 Group Organization
- Organize prompts into groups within libraries
- Drag-and-drop sorting (planned)
- Search within groups

### 🎨 Prompt Management
- Full CRUD operations for prompts
- Comprehensive generation parameters:
  - Positive/negative prompts
  - Steps, CFG Scale, Sampler
  - Model selection
  - Seed values
  - Dimensions (width × height)
  - Notes and metadata
- Expand/collapse prompt cards
- Copy-to-clipboard functionality
- Favorites system

### 🔍 Search & Discovery
- Full-text search across all prompts
- Search within specific libraries
- Filter by favorites
- Advanced search through prompts, notes, and group names

### 🎯 User Experience
- Responsive design (mobile & desktop)
- Clean, modern UI with Tailwind CSS
- Loading states and error handling
- Keyboard shortcuts support

## 🚀 Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kevtice15/promptcraft-web.git
   cd promptcraft-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Create `.env` and `.env.local` files:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/promptcraft"
   JWT_SECRET="your-secret-key-min-32-characters-long-for-production"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit `http://localhost:3000`

## 📖 Usage Guide

### Getting Started
1. **Sign up** for a new account or **login** with existing credentials
2. **Create your first library** to organize your prompts
3. **Add groups** within your library to categorize prompts
4. **Create prompts** with detailed generation parameters
5. **Search and manage** your prompt collection

### Library Management
- **Public Libraries**: Accessible without password
- **Private Libraries**: Password-protected, require unlocking each session
- **Color Coding**: Assign colors to libraries for visual organization

### Prompt Creation
Fill in the prompt creation form with:
- **Positive Prompt**: What you want to generate (required)
- **Negative Prompt**: What to avoid (optional)
- **Generation Parameters**: Steps, CFG Scale, Sampler, Model
- **Dimensions**: Width × Height (common presets available)
- **Seed**: For reproducible generations (optional)
- **Notes**: Additional context or instructions

### Search Features
- **Global Search**: Search across all prompts in a library
- **Group Search**: Search within specific groups
- **Favorites Filter**: View only starred prompts
- **Text Matching**: Searches prompts, notes, and group names

## 🛠 Development

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with jose library
- **Password Hashing**: bcrypt

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # Reusable UI primitives
│   ├── auth/              # Authentication components
│   ├── library/           # Library management
│   ├── groups/            # Group management
│   ├── prompts/           # Prompt management
│   └── layout/            # Layout components
├── lib/                   # Utility functions
└── types/                 # TypeScript definitions
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Database Commands
```bash
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema to database
npx prisma migrate dev  # Create and apply migrations
npx prisma studio       # Open Prisma Studio
```

## 🗃 Database Schema

### Core Models
- **User**: User accounts with authentication
- **Library**: Top-level prompt collections
- **Group**: Organization units within libraries  
- **Prompt**: Individual prompts with parameters

### Relationships
- User → Libraries (one-to-many)
- Library → Groups (one-to-many, cascade delete)
- Group → Prompts (one-to-many, cascade delete)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure session management
- **Library Privacy**: Optional password protection
- **Session-based Unlocking**: In-memory access control
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Import your repository: `kevtice15/promptcraft-web`

2. **Configure environment variables**
   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database"
   JWT_SECRET="your-production-secret-key-min-32-characters"
   NEXT_PUBLIC_APP_URL="https://your-app-domain.vercel.app"
   ```

3. **Deploy**
   - Vercel will automatically deploy on every push to `main`
   - Run database migrations after first deploy:
     ```bash
     npx prisma generate
     npx prisma db push
     ```

### Other Platforms

The app can be deployed to any platform that supports Node.js:
- **Railway**: Connect GitHub repo and set environment variables
- **Render**: Import from GitHub and configure build settings
- **Digital Ocean App Platform**: Deploy from GitHub with auto-deploy
- **AWS/Google Cloud**: Use their respective deployment services

### Database Setup

For production, use a managed PostgreSQL service:
- **Supabase** (recommended for Vercel)
- **PlanetScale** 
- **Railway PostgreSQL**
- **Render PostgreSQL**
- **AWS RDS**

## 🚧 Roadmap

### Recently Added Features ✅
- ✅ Consistent TopNavigation across all pages
- ✅ Library switching from navigation menu
- ✅ Improved user experience and navigation flow

### Planned Features
- [ ] Image upload and management system
- [ ] Prompt templates and presets  
- [ ] Library sharing and collaboration
- [ ] Advanced search with filters
- [ ] Bulk operations (import/export)
- [ ] Prompt history and versioning
- [ ] API integration for image generation
- [ ] Mobile app

### Performance Improvements
- [ ] Image optimization and CDN
- [ ] Caching layer (Redis)
- [ ] Database indexing optimization
- [ ] Real-time collaboration features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup for Contributors
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m "Add amazing feature"`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**

🔗 **GitHub Repository**: https://github.com/kevtice15/promptcraft-web