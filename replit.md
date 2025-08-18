# Replit Configuration

## Overview

This is a full-stack ERP (Enterprise Resource Planning) software built with React/TypeScript frontend and Node.js/Express backend. The application provides comprehensive business management capabilities including inventory management, sales orders, expense tracking, employee management, and audit logging. It features role-based access control with three user levels (Employee, Manager, Admin) and includes a modern dashboard with data visualization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **State Management**: Redux Toolkit for global application state and React Query for server state management
- **UI Library**: Shadcn/UI components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts library for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Passport.js with Local Strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Design**: RESTful API with role-based middleware protection
- **Audit System**: Comprehensive logging of all CRUD operations with user tracking

### Data Storage
- **Primary Database**: PostgreSQL for all application data
- **Session Store**: PostgreSQL-backed session storage using connect-pg-simple
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL connection

### Authentication & Authorization
- **Authentication Method**: Username/password with secure password hashing
- **Session Management**: Server-side sessions with HTTP-only cookies
- **Role-Based Access Control**: Three-tier system (Employee, Manager, Admin)
- **Protected Routes**: Frontend route protection based on authentication state
- **API Security**: Middleware-based endpoint protection with role verification

### Key Data Models
- **Users**: Employee management with role assignment and status tracking
- **Inventory Items**: Product catalog with SKU, pricing, stock levels, and categories
- **Sales Orders**: Order management with customer details and line items
- **Expenses**: Business expense tracking with categories and approval workflow
- **Audit Logs**: Complete activity tracking with user, action, and timestamp details

### Development Architecture
- **Build System**: Vite for fast development and optimized production builds
- **Code Organization**: Monorepo structure with shared schema definitions
- **Type Safety**: End-to-end TypeScript with shared types between client and server
- **Development Tools**: Hot module replacement, runtime error overlays, and TypeScript checking

## External Dependencies

### Core Backend Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Modern TypeScript ORM for database operations
- **passport**: Authentication middleware for Node.js
- **express-session**: Session management for Express applications
- **connect-pg-simple**: PostgreSQL session store adapter

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@reduxjs/toolkit**: Predictable state container for JavaScript apps
- **recharts**: Composable charting library built on React components
- **@radix-ui/***: Low-level UI primitives for building design systems
- **react-hook-form**: Performant, flexible forms with easy validation
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **wouter**: Minimalist routing library for React

### Development Dependencies
- **drizzle-kit**: Database toolkit for schema management and migrations
- **tsx**: TypeScript execution environment for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Database & Hosting
- **PostgreSQL**: Primary database for all application data
- **Neon Database**: Serverless PostgreSQL hosting service
- **Replit**: Development and hosting environment