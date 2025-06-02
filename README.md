<div align="center">

# 🚀 Kira-Version1

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A modern, full-stack web application built with Next.js 15, TypeScript, and advanced UI components**

[🌟 Features](#features) • [🚀 Quick Start](#quick-start) • [📚 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

---

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- 🎨 **Modern UI Components** - Built with Radix UI primitives and Tailwind CSS
- 🌙 **Dark/Light Theme** - Seamless theme switching with next-themes
- 📱 **Responsive Design** - Mobile-first approach with beautiful animations
- 🔧 **Type Safety** - Full TypeScript support for robust development
- 🎯 **Form Handling** - React Hook Form with Zod validation
- 📊 **Data Visualization** - Interactive charts with Recharts
- 🎛️ **Advanced UI** - Carousels, dialogs, tooltips, and more

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **Authentication** | JWT, bcryptjs |
| **Forms** | React Hook Form, Zod validation |
| **Charts** | Recharts |
| **Dev Tools** | ESLint, TypeScript |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/danish296/Kira-Version1.git
   cd Kira-Version1
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your environment variables:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
Kira-Version1/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   └── ui/               # Shadcn/ui components
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication logic
│   └── utils.ts         # Helper functions
├── public/              # Static assets
├── package.json         # Dependencies
└── tailwind.config.js   # Tailwind configuration
```

## 🔐 Authentication

The project includes a robust authentication system:

```typescript
// Example: Protected route usage
import { getUser } from '@/lib/auth'

export default async function ProtectedPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

### Available Auth Functions

- `hashPassword(password)` - Hash passwords securely
- `verifyPassword(password, hash)` - Verify password against hash
- `createToken(payload)` - Generate JWT tokens
- `verifyToken(token)` - Verify and decode JWT tokens
- `getUser()` - Get current authenticated user

## 🎨 UI Components

Built with Radix UI primitives for accessibility and Tailwind CSS for styling:

```tsx
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <Input placeholder="Enter something..." />
        <Button>Submit</Button>
      </DialogContent>
    </Dialog>
  )
}
```

Available components include:
- Buttons, Inputs, Selects
- Dialogs, Popovers, Tooltips
- Navigation, Tabs, Accordions
- Charts, Progress indicators
- And much more!

## 📱 Responsive Design

The application is built mobile-first with Tailwind CSS:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-2">Feature 1</h3>
    <p className="text-muted-foreground">Description here</p>
  </Card>
</div>
```

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style

This project follows TypeScript best practices:

- Strict type checking enabled
- ESLint for code quality
- Consistent naming conventions
- Component-based architecture

## 🌙 Theme Support

Toggle between light and dark themes:

```tsx
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="outline"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      Toggle Theme
    </Button>
  )
}
```

## 📊 Performance

- ⚡ **Fast builds** with Next.js 15
- 🎯 **Optimized bundles** with automatic code splitting
- 🖼️ **Image optimization** built-in
- 🚀 **Static generation** support

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Write TypeScript with proper types
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Danish** - [@danish296](https://github.com/danish296)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/danish296/Kira-Version1/issues) • [Request Feature](https://github.com/danish296/Kira-Version1/issues) • [Discussions](https://github.com/danish296/Kira-Version1/discussions)

Made with ❤️ by [danish296](https://github.com/danish296)

</div>
