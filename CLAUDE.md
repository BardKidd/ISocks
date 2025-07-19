# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript application built with a monorepo structure using Turborepo and pnpm. It consists of:

- **Backend**: NestJS API with TypeORM, MySQL database, JWT authentication, and WebSocket support
- **Frontend**: React/Vite application with shadcn/ui components, CASL authorization, and socket.io client

## Development Commands

### Root Level (Turborepo)
```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Lint all apps
pnpm lint

# Type checking across all apps
pnpm check-types

# Format code
pnpm format
```

### Backend (NestJS)
```bash
cd apps/Backend

# Development with hot reload
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm test:cov

# Database migrations
pnpm migration:generate -- -n MigrationName
pnpm migration:run
pnpm migration:revert
```

### Frontend (React/Vite)
```bash
cd apps/Frontend

# Development server
pnpm dev

# Production build
pnpm build

# Lint
pnpm lint

# Preview production build
pnpm preview
```

## Architecture

### Backend Structure
- **Authentication**: JWT-based auth with Passport.js
- **Database**: TypeORM with MySQL, includes User and Post entities
- **Validation**: class-validator and class-transformer for DTOs
- **API Documentation**: Swagger/OpenAPI integration
- **WebSockets**: Socket.io for real-time features
- **Error Handling**: Global exception filters

### Frontend Structure
- **UI Framework**: React 19 with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v7
- **Authorization**: CASL for permission-based access control
- **State Management**: React Context (AuthContext)
- **Real-time**: Socket.io client

### Key Technologies
- **Monorepo**: Turborepo for build orchestration
- **Package Manager**: pnpm with workspaces
- **TypeScript**: Strict typing across both apps
- **Database**: MySQL with TypeORM migrations
- **Authentication**: JWT tokens with refresh mechanism
- **Real-time**: WebSocket connections for live features

## Environment Setup

Backend requires these environment variables in `apps/Backend/.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- JWT secret configuration
- Database connection settings

## Important Notes

- Database synchronization is disabled in production - use migrations only
- The project uses TypeScript with strict settings
- Frontend uses alias `@` pointing to `/src`
- Backend uses decorators and metadata reflection
- Socket.io is configured for cross-origin requests
- Permission system is implemented with CASL abilities