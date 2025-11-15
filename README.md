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

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure session management
- **Library Privacy**: Optional password protection
- **Session-based Unlocking**: In-memory access control
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**

🔗 **GitHub Repository**: https://github.com/kevtice15/promptcraft-web