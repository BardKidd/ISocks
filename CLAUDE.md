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
- **Design System**: Apple Human Interface Guidelines 2025 (Liquid Glass design system) with optional Neumorphism elements
- **Styling**: Tailwind CSS + shadcn/ui components
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

### 🚨 CRITICAL RULE: Research Before Implementation (Use Context7)
**MANDATORY**: Before suggesting any code that uses external APIs, packages, or libraries, Claude Code MUST:
1. **Use WebSearch/WebFetch (context7)** to verify current official documentation
2. **Check actual API response formats** from official sources using context7
3. **Verify package versions and methods** from official docs using context7
4. **NEVER assume or guess** API structures, field names, or response formats

**Required Research Process (context7)**:
- External APIs (Alpha Vantage, etc.) → Use context7 to check official API documentation
- npm packages → Use context7 to check official package documentation and latest versions  
- Framework methods → Use context7 to verify from official framework documentation
- Database schemas → Use context7 to check official documentation
- Any third-party service → Use context7 to verify official specifications

**Context7 Usage Pattern**:
When user says "use context7" or equivalent, Claude Code must research using WebSearch/WebFetch tools to gather accurate, up-to-date information before providing any implementation suggestions.

### 1. Task Planning
- Each development phase is broken down into specific tasks
- Tasks are documented in `TODO.md` for tracking progress
- Features are developed incrementally, step by step

### 2. Code Generation & Documentation (With Research)
- **FIRST**: Research and verify all external dependencies and APIs
- Claude Code generates implementation ideas and code snippets based on verified information
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
- **UI Design**: Apple Human Interface Guidelines 2025 (Liquid Glass) with optional Neumorphism elements, combined with shadcn/ui components
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

## UI Design System: Apple Human Interface Guidelines 2025

### 🎨 Design Philosophy Update (2025)

**Primary Design System**: Apple Human Interface Guidelines 2025 with **Liquid Glass** design language
- **Secondary Elements**: Optional Neumorphism elements for specific components
- **Component Library**: shadcn/ui + Tailwind CSS for implementation

### 🌟 Key 2025 Design Principles

#### 1. **Liquid Glass** - New Functional Layer
- **Purpose**: Creates spatial relationships between surfaces without stealing focus
- **Implementation**: Floating UI elements above content with subtle transparency effects
- **Usage in IStocks**: Modal dialogs, floating action buttons, overlay panels for stock details

#### 2. **Unified Hardware-Software Rhythm**
- **Principle**: UI curvature aligns with device bezels and proportions
- **Typography**: Bolder, left-aligned text for improved readability
- **Application**: Card components, button radiuses, and container shapes follow device proportions

#### 3. **Enhanced Visual Hierarchy**
- **Colors**: Refined system colors with improved hue differentiation
- **Typography**: New York (serif) for financial data, San Francisco (sans-serif) for UI elements
- **Spacing**: Consistent layout that adapts to various screen contexts

### 🎯 Core Design Values

#### **Clarity** (Primary Focus)
- **Principle**: Every interface element has a clear purpose
- **IStocks Application**: 
  - Stock prices displayed with high contrast and large, readable fonts
  - Portfolio performance charts with clear data visualization
  - Simplified navigation with intuitive iconography

#### **Deference** (Content-First)
- **Principle**: UI should enhance content, not compete with it
- **IStocks Application**:
  - Stock data and charts as primary visual focus
  - Minimal decorative elements that don't distract from financial information
  - Clean backgrounds that make data pop

#### **Depth** (Guided Focus)
- **Principle**: Subtle shadows and layering guide user attention
- **IStocks Application**:
  - Elevated cards for individual stocks
  - Layered modals for detailed stock information
  - Subtle depth in interactive elements

### 🎨 Design System Components

#### **Color Strategy**
- **Financial Data Colors**: High contrast for accessibility
  - **Positive Returns**: Apple's optimistic green variants
  - **Negative Returns**: Apple's attention-grabbing red variants
  - **Neutral Data**: System grays for balanced presentation

#### **Typography Hierarchy**
```
Portfolio Headers: SF Pro Display Bold, 32px (left-aligned)
Stock Prices: New York Medium, 24px (financial data emphasis)
Stock Names: SF Pro Text Semibold, 18px
Metadata: SF Pro Text Regular, 14px
UI Labels: SF Pro Text Medium, 16px
```

#### **Spacing and Layout**
- **Grid System**: 8px base unit following Apple's consistent spacing
- **Card Padding**: 16px/24px for optimal touch targets
- **Component Margins**: 12px/16px/24px progressive spacing
- **Safe Areas**: Respect device notches and bezels

#### **Interactive Elements**
- **Touch Targets**: Minimum 44x44pt following accessibility guidelines
- **Button Styles**: Rounded corners matching device curvature
- **Hover States**: Subtle Liquid Glass effects for web interactions
- **Focus States**: High contrast borders for keyboard navigation

### 🔧 Implementation Guidelines

#### **Web-Specific Adaptations**
- **Custom Toolbars**: Remove unnecessary background colors, rely on layout for hierarchy
- **Navigation**: Organize by function and frequency of use
- **Responsive Design**: Adapt Apple's principles across device breakpoints

#### **Accessibility Focus**
- **Dynamic Type**: Support for user-preferred text sizes
- **High Contrast**: Enhanced color differentiation for visual accessibility
- **Multiple Interaction Methods**: Support for touch, keyboard, and assistive technologies
- **Color Independence**: Information not solely conveyed through color

### 💼 IStocks-Specific Design Applications

#### **Dashboard Design**
- **Layout**: Left-aligned headers with portfolio summary cards
- **Data Visualization**: Clean, high-contrast charts with Liquid Glass overlays
- **Navigation**: Tab-based structure following Apple's organizational patterns

#### **Stock Detail Views**
- **Information Hierarchy**: Price prominence, secondary details in organized sections
- **Interactive Elements**: Floating action buttons for buy/sell actions
- **Historical Data**: Clean timeline visualization with clear data points

#### **Portfolio Management**
- **List Design**: Card-based layout with consistent spacing and shadows
- **Actions**: Context-sensitive buttons with clear visual feedback
- **Forms**: Clean input design with helpful validation states

### 🚀 Implementation Priority

1. **Phase 1**: Establish basic color palette and typography system
2. **Phase 2**: Implement core component library with Apple-inspired designs
3. **Phase 3**: Add Liquid Glass effects and advanced interactive elements
4. **Phase 4**: Refine with optional Neumorphism elements where appropriate

### 📚 Resources and References

- **Official Documentation**: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- **Design Resources**: [Apple Design Resources](https://developer.apple.com/design/resources/)
- **2025 Updates**: WWDC 2025 - "Get to know the new design system"
- **Accessibility**: [Apple Accessibility Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility)

This design system ensures IStocks provides a premium, accessible, and intuitive user experience that feels natural to users familiar with Apple's ecosystem while being functional across all web platforms.