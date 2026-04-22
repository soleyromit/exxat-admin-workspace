# Exxat One - Project Dependencies

This document provides a comprehensive list of all dependencies used in the Exxat One healthcare placement and internship management platform, along with installation instructions and documentation links.

## Core Framework & Build Tools

### React
**Frontend library for building user interfaces**
- **Version**: Latest stable
- **Installation**: `npm install react react-dom`
- **TypeScript Types**: `npm install @types/react @types/react-dom`
- **Documentation**: [https://reactjs.org/](https://reactjs.org/)
- **Usage**: Core framework for all components

### Next.js (if applicable)
**React framework with additional features**
- **Installation**: `npx create-next-app@latest`
- **Documentation**: [https://nextjs.org/](https://nextjs.org/)

### TypeScript
**Static type checking for JavaScript**
- **Installation**: `npm install typescript`
- **Configuration**: Requires `tsconfig.json`
- **Documentation**: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)

## Styling & UI Framework

### Tailwind CSS v4
**Utility-first CSS framework**
- **Version**: v4.0 (Latest)
- **Installation**: `npm install tailwindcss@next`
- **Documentation**: [https://tailwindcss.com/](https://tailwindcss.com/)
- **Configuration**: Uses CSS custom properties and `@theme` directive
- **Usage**: All component styling throughout the application

### Shadcn/UI
**Component library built on Radix UI and Tailwind CSS**
- **Installation**: `npx shadcn-ui@latest init`
- **Documentation**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Components Used**:
  - Button, Card, Input, Label, Badge, Tabs
  - Dialog, Dropdown Menu, Popover, Select
  - Table, Pagination, Calendar, Avatar
  - Sidebar, Navigation Menu, Breadcrumb
  - Alert, Tooltip, Progress, Skeleton
  - Form components and validation

### Radix UI
**Low-level UI primitives (used by Shadcn/UI)**
- **Installation**: Individual packages as needed
- **Documentation**: [https://www.radix-ui.com/](https://www.radix-ui.com/)
- **Core Packages**:
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-checkbox`

## Icons & Visual Assets

### Lucide React
**Beautiful & consistent icon toolkit**
- **Installation**: `npm install lucide-react`
- **Documentation**: [https://lucide.dev/](https://lucide.dev/)
- **Usage**: All icons throughout the application
- **Examples**: `Users`, `Calendar`, `Settings`, `Search`, `Filter`

## Charts & Data Visualization

### Recharts
**Composable charting library built on D3**
- **Installation**: `npm install recharts`
- **Documentation**: [https://recharts.org/](https://recharts.org/)
- **Components Used**:
  - `LineChart`, `AreaChart`, `BarChart`
  - `PieChart`, `ResponsiveContainer`
  - `XAxis`, `YAxis`, `CartesianGrid`
  - `Tooltip`, `Legend`
- **Usage**: Reports page charts, dashboard metrics visualization

## State Management

### Zustand
**Small, fast and scalable state management**
- **Installation**: `npm install zustand`
- **Documentation**: [https://zustand-demo.pmnd.rs/](https://zustand-demo.pmnd.rs/)
- **Usage**: Global application state, navigation management
- **Store Location**: `/stores/app-store.ts`

## Backend & Database (Optional)

### Supabase (if integrated)
**Open source Firebase alternative**
- **Installation**: `npm install @supabase/supabase-js`
- **Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Usage**: Backend services, authentication, real-time data

## Form Handling

### React Hook Form
**Efficient, flexible forms with validation**
- **Installation**: `npm install react-hook-form@7.55.0`
- **Documentation**: [https://react-hook-form.com/](https://react-hook-form.com/)
- **Usage**: Form state management and validation
- **Note**: Must use specific version `7.55.0`

### Zod (for validation)
**TypeScript-first schema validation**
- **Installation**: `npm install zod`
- **Documentation**: [https://zod.dev/](https://zod.dev/)
- **Usage**: Form validation schemas, type-safe validation

## Utility Libraries

### Class Variance Authority (CVA)
**Creating variants with classes**
- **Installation**: `npm install class-variance-authority`
- **Documentation**: [https://cva.style/docs](https://cva.style/docs)
- **Usage**: Component variant management

### clsx
**Constructing className strings conditionally**
- **Installation**: `npm install clsx`
- **Documentation**: [https://github.com/lukeed/clsx](https://github.com/lukeed/clsx)
- **Usage**: Conditional CSS class application

### Tailwind Merge
**Merge Tailwind CSS classes without style conflicts**
- **Installation**: `npm install tailwind-merge`
- **Documentation**: [https://github.com/dcastil/tailwind-merge](https://github.com/dcastil/tailwind-merge)
- **Usage**: Merging conflicting Tailwind classes

## Date & Time Handling

### date-fns
**Modern JavaScript date utility library**
- **Installation**: `npm install date-fns`
- **Documentation**: [https://date-fns.org/](https://date-fns.org/)
- **Usage**: Date formatting, manipulation, and utilities
- **Format Standard**: MM/DD/YYYY across all components

## Notifications & Feedback

### Sonner
**Opinionated toast component**
- **Installation**: `npm install sonner@2.0.3`
- **Documentation**: [https://sonner.emilkowal.ski/](https://sonner.emilkowal.ski/)
- **Usage**: Toast notifications, user feedback
- **Import**: `import { toast } from "sonner@2.0.3"`

## Animation & Interactions

### Framer Motion
**Production-ready motion library for React**
- **Installation**: `npm install framer-motion`
- **Documentation**: [https://www.framer.com/motion/](https://www.framer.com/motion/)
- **Usage**: Animations, transitions, gesture handling

### React DnD
**Drag and drop for React**
- **Installation**: `npm install react-dnd react-dnd-html5-backend`
- **Documentation**: [https://react-dnd.github.io/react-dnd/](https://react-dnd.github.io/react-dnd/)
- **Usage**: Table column reordering, drag interactions

## Carousel & Layout

### React Slick
**Carousel component built with React**
- **Installation**: `npm install react-slick slick-carousel`
- **Types**: `npm install @types/react-slick`
- **Documentation**: [https://react-slick.neostack.com/](https://react-slick.neostack.com/)
- **Usage**: Image carousels, content sliders

### React Responsive Masonry
**Responsive masonry layout**
- **Installation**: `npm install react-responsive-masonry`
- **Documentation**: [https://github.com/xuopleusername/react-responsive-masonry](https://github.com/xuopleusername/react-responsive-masonry)
- **Usage**: Masonry grid layouts

## Layout & Positioning

### Popper.js (React)
**Positioning engine for tooltips and popovers**
- **Installation**: `npm install @popperjs/core react-popper`
- **Documentation**: [https://popper.js.org/](https://popper.js.org/)
- **Usage**: Advanced positioning for UI elements

### Re-resizable
**Resizable component for React**
- **Installation**: `npm install re-resizable`
- **Documentation**: [https://github.com/bokuweb/re-resizable](https://github.com/bokuweb/re-resizable)
- **Usage**: Resizable panels and components
- **Note**: Use instead of `react-resizable` (not supported)

## Development Tools

### ESLint
**JavaScript/TypeScript linting utility**
- **Installation**: `npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
- **Configuration**: `.eslintrc.js` or `eslint.config.js`
- **Documentation**: [https://eslint.org/](https://eslint.org/)

### Prettier
**Code formatter**
- **Installation**: `npm install prettier`
- **Configuration**: `.prettierrc`
- **Documentation**: [https://prettier.io/](https://prettier.io/)

## Package Manager

### npm or yarn or pnpm
**Package management**
- **npm**: Comes with Node.js
- **yarn**: `npm install -g yarn`
- **pnpm**: `npm install -g pnpm`

## Installation Commands

### Complete Setup
```bash
# Core React setup
npm install react react-dom @types/react @types/react-dom typescript

# Tailwind CSS v4
npm install tailwindcss@next

# Shadcn/UI setup
npx shadcn-ui@latest init

# State management
npm install zustand

# Icons
npm install lucide-react

# Charts
npm install recharts

# Forms
npm install react-hook-form@7.55.0 zod

# Utilities
npm install class-variance-authority clsx tailwind-merge

# Date handling
npm install date-fns

# Notifications
npm install sonner@2.0.3

# Animation
npm install framer-motion

# Drag and drop
npm install react-dnd react-dnd-html5-backend

# Carousel
npm install react-slick slick-carousel @types/react-slick

# Layout utilities
npm install react-responsive-masonry re-resizable

# Positioning
npm install @popperjs/core react-popper

# Optional: Supabase
npm install @supabase/supabase-js

# Development tools
npm install eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Shadcn/UI Components Installation
```bash
# Install individual components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sidebar
# ... and so on for each component used
```

## Version Constraints

### Required Specific Versions
- **React Hook Form**: Must use `react-hook-form@7.55.0`
- **Sonner**: Must use `sonner@2.0.3`
- **Tailwind CSS**: Use `tailwindcss@next` for v4.0

### Compatibility Notes
- **React DnD**: Ensure HTML5 backend is installed alongside
- **Slick Carousel**: Requires both `react-slick` and `slick-carousel`
- **Re-resizable**: Use instead of `react-resizable` (not supported in this environment)

## Documentation & Resources

### Official Documentation Links
- **React**: [https://reactjs.org/docs](https://reactjs.org/docs)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Shadcn/UI**: [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- **TypeScript**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Zustand**: [https://docs.pmnd.rs/zustand](https://docs.pmnd.rs/zustand)

### Community Resources
- **Tailwind UI**: [https://tailwindui.com/](https://tailwindui.com/) (Premium components)
- **Radix UI**: [https://www.radix-ui.com/primitives](https://www.radix-ui.com/primitives)
- **React Hook Form Examples**: [https://react-hook-form.com/get-started](https://react-hook-form.com/get-started)

## Troubleshooting

### Common Issues
1. **Tailwind CSS v4**: Ensure you're using the `@next` tag for v4.0 features
2. **Shadcn/UI**: Some components may need manual adjustment for custom styling
3. **React Hook Form**: Use the specific version to avoid compatibility issues
4. **Type Errors**: Ensure all `@types/*` packages are installed for TypeScript

### Support & Updates
- Check individual package documentation for breaking changes
- Follow semantic versioning for major updates
- Test thoroughly when updating dependencies
- Maintain version lock files (`package-lock.json` or `yarn.lock`)

---

*This dependency list should be kept updated as the project evolves. Always check the latest documentation for each package before implementation.*