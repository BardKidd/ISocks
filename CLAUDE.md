# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IStocks** is a personal investment portfolio management system that allows users to track their investment performance and compare it with global market indices. This is a full-stack TypeScript application built with a monorepo structure using Turborepo and pnpm.

### Core Features
- 📊 **Portfolio Management**: Create and manage personal investment portfolios
- 📈 **Stock Market Data**: Integration with Alpha Vantage API for real-time global stock data
- 📉 **Performance Comparison**: Compare personal portfolio performance against market indices
- 🎨 **Interactive Charts**: Visualize performance data using Chart.js
- 🔐 **User Authentication**: Secure user accounts and portfolio data

### Tech Stack
- **Backend**: NestJS API with TypeORM, MySQL database, JWT authentication
- **Frontend**: React/Vite application with Neumorphism UI design + shadcn/ui components
- **APIs**: Alpha Vantage API for stock market data
- **Charts**: Chart.js for data visualization
- **Database**: MySQL with TypeORM migrations

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
- **Authentication**: JWT-based auth with Passport.js for user registration/login
- **Database**: TypeORM with MySQL, includes User and Portfolio entities
- **Stock Market API**: Alpha Vantage API integration for stock data
- **Validation**: class-validator and class-transformer for DTOs
- **API Documentation**: Swagger/OpenAPI integration
- **Error Handling**: Global exception filters
- **Data Processing**: Stock price calculations and portfolio analytics

### Frontend Structure
- **UI Framework**: React 19 with Vite
- **Styling**: Neumorphism design + Tailwind CSS + shadcn/ui components
- **Charts**: Chart.js for portfolio performance visualization
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v7
- **State Management**: React Context (AuthContext, PortfolioContext)
- **Local Storage**: Persistent login state to avoid repeated authentication
- **API Communication**: Axios for REST API calls

### Key Technologies
- **Language**: Full TypeScript implementation across frontend and backend
- **Monorepo**: Turborepo for build orchestration
- **Package Manager**: pnpm with workspaces
- **Database**: MySQL with TypeORM migrations
- **Authentication**: JWT tokens with refresh mechanism + local storage persistence
- **External APIs**: Alpha Vantage API for stock market data
- **Data Visualization**: Chart.js for interactive charts

## Development Workflow with Claude Code

This project follows a structured development workflow between the user and Claude Code:

### 1. Task Planning
- Each development phase is broken down into specific tasks
- Tasks are documented in `TODO.md` for tracking progress
- Features are developed incrementally, step by step

### 2. Code Generation & Documentation
- Claude Code generates implementation ideas and code snippets
- All code and implementation plans are documented in markdown files
- Files are organized in a dedicated folder (e.g., `/claude-dev/`)
- Multiple files can be created for different aspects (API, UI, database, etc.)
- Code is provided in small, manageable chunks for review

### 3. Review & Implementation
- User reviews the generated code and documentation
- User manually implements the code as a learning exercise
- This approach ensures continuity even if Claude Code sessions are interrupted

### 4. Iterative Development
- Development proceeds one step at a time
- Each step is reviewed and approved before moving to the next
- Focus on incremental progress rather than large feature dumps

## Environment Setup

Backend requires these environment variables in `apps/Backend/.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` for authentication
- `ALPHA_VANTAGE_API_KEY` for stock market data
- Database connection settings

Frontend may require:
- API endpoint configurations
- Chart.js configuration settings

## Important Notes

- **Full TypeScript**: All code must be written in TypeScript with strict typing
- **User Authentication**: Support for user registration and login functionality
- **Local Storage**: Login state persistence to avoid repeated authentication
- **Database**: MySQL with TypeORM migrations (synchronization disabled in production)
- **API Integration**: Alpha Vantage API for real-time stock market data
- **UI Design**: Neumorphism style combined with shadcn/ui components
- **Charts**: Interactive portfolio performance visualization with Chart.js
- **Frontend Alias**: Uses `@` pointing to `/src`
- **Backend**: Uses decorators and metadata reflection

## Technical Decisions

### HTTP Client: @nestjs/axios + firstValueFrom
**Decision**: Use `@nestjs/axios` with `firstValueFrom` from RxJS instead of native axios

**Rationale**:
- Follows NestJS ecosystem standards and best practices
- Maintains consistency with other NestJS services
- Supports dependency injection pattern
- Better integration with NestJS testing framework
- Easier to add interceptors and middleware in the future
- Only requires learning one RxJS operator: `firstValueFrom`

**Usage Pattern**:
```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const response = await firstValueFrom(this.httpService.get(url));
```

**Dependencies Required**:
```bash
pnpm install @nestjs/axios axios
```