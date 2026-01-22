# Team 1 Time Reporting System - Project Overview
## Focus: Process, Collaboration & Technical Decisions

---

## Slide 1: Title Slide
**Team 1 Time Reporting System**

*Development Process & Technical Decisions*

---

## Slide 2: Project Overview
**What We Built**
- Full-stack time-tracking platform
- Monorepo architecture (3 services)
- Dual-interface system (User + Admin)

**What This Presentation Covers**
- Decision-making framework
- OpenSpec workflow
- Team collaboration strategy
- Git workflow & CI/CD
- Tech stack rationale

---

## Slide 3: Decision-Making Framework

### Structured Approach to Technical Decisions

**Decision Tree Process:**
1. **Identify the Need** - What problem are we solving?
2. **Explore Alternatives** - What options exist?
3. **Evaluate Trade-offs** - Pros/cons of each approach
4. **Document Decision** - Capture rationale in `design.md`
5. **Review & Approve** - Team consensus before implementation

**Key Principle:** 
> "When in doubt, create a proposal" - Better to over-communicate than assume

**Decision Documentation:**
- `design.md` files capture: Context, Goals, Decisions, Alternatives, Risks
- Example: Full-stack feature ownership vs. Backend/Frontend split

---

## Slide 4: OpenSpec Workflow

### Spec-Driven Development

**Three-Stage Workflow:**

**Stage 1: Creating Changes**
- Create proposal when adding features, breaking changes, or architecture shifts
- Scaffold: `proposal.md`, `tasks.md`, optional `design.md`
- Write spec deltas with requirements and scenarios
- Validate: `openspec validate <id> --strict`
- **Approval gate** - No implementation until approved

**Stage 2: Implementing Changes**
- Read proposal → design → tasks
- Implement sequentially
- Update checklist as tasks complete

**Stage 3: Archiving Changes**
- After deployment, archive to `changes/archive/`
- Update specs if capabilities changed

**Benefits:**
- Clear requirements before coding
- Team alignment on what to build
- Living documentation of system capabilities

---

## Slide 5: OpenSpec Structure

### How We Organize Specifications

```
openspec/
├── project.md          # Project conventions
├── specs/              # Current truth (what IS built)
│   └── [capability]/
│       └── spec.md     # Requirements & scenarios
└── changes/            # Proposals (what SHOULD change)
    ├── [change-id]/
    │   ├── proposal.md # Why, what, impact
    │   ├── tasks.md    # Implementation checklist
    │   ├── design.md   # Technical decisions
    │   └── specs/      # Delta changes
    └── archive/        # Completed changes
```

**Key Concepts:**
- **Specs** = What exists (source of truth)
- **Changes** = What we want to build (proposals)
- **Archive** = What was completed (history)

**Decision Tree:**
- Bug fix? → Fix directly
- New feature? → Create proposal
- Unclear? → Create proposal (safer)

---

## Slide 6: Team Collaboration Strategy

### Full-Stack Feature Ownership

**Our Approach:**
Each developer owns a complete feature end-to-end (both backend and frontend)

| Member | Feature | Scope |
|--------|---------|-------|
| Member 1 | Auth + User Management | Auth API + Login UI + User Management |
| Member 2 | Time Reporting | Attendance API + Daily Report UI + Month History |
| Member 3 | Entity Management | Clients/Projects/Tasks APIs + Admin Tables/Forms |
| Member 4 | Advanced Features | Timer API + Timer UI + Dashboard + File Upload |

**Why This Works:**
- ✅ Less coordination needed
- ✅ Faster debugging (same person knows API + UI)
- ✅ Better ownership and accountability
- ✅ Parallel development with minimal collisions

**Alternatives Considered:**
- ❌ Backend/Frontend split (rejected - too much coordination)
- ❌ Feature-based without full-stack (rejected - too many handoffs)

---

## Slide 7: Git Workflow & Branching Strategy

### Branch-Based Development Flow

**Branch Structure:**
```
main (production)
  ↑
dev (staging)
  ↑
feature/* (development)
fix/* (bug fixes)
```

**Development Lifecycle:**

1. **Create Feature Branch** → `feature/your-feature`
   - Unit tests run on every push

2. **Open PR to `dev`** → `feature/*` → `dev`
   - Unit + Integration tests run

3. **Merge to `dev`** → Code ready for staging

4. **Open PR to `main`** → `dev` → `main`
   - Full test suite runs

5. **Merge to `main`** → Auto-deploy to production (Render)

**Key Practices:**
- Feature branches for new work
- Fix branches for bug fixes
- PR reviews before merging
- CI/CD runs tests automatically

---

## Slide 8: CI/CD Pipeline

### Automated Testing & Deployment

**Pipeline Stages:**

**1. Unit Tests** (Runs on all branches)
- Fast feedback loop
- Tests individual functions/components
- Colocated with source code

**2. Integration Tests** (Runs on PRs + feature branches)
- Tests full workflows (API → Database)
- Requires PostgreSQL service
- Validates end-to-end functionality

**3. Deployment** (Runs on merge to `main`)
- Triggers Render deployment hooks
- Backend, User Frontend, Admin Frontend
- Automatic after tests pass

**Testing Standards:**
- Framework: Vitest
- Coverage Target: 60%
- Unit tests: Fast, isolated
- Integration tests: Full system validation

---

## Slide 9: Tech Stack Decisions - Backend

### Why We Chose These Technologies

**Core Stack:**
- **Node.js + Express + TypeScript**
  - Why: Type safety, mature ecosystem, team familiarity
- **PostgreSQL + Prisma**
  - Why: Strong typing, migrations, excellent DX
- **Zod**
  - Why: Runtime validation, TypeScript integration, single source of truth
- **Vitest**
  - Why: Fast, Vite-native, great TypeScript support

**Architecture Pattern:**
```
Routes → Controllers → Services
```
- Routes: Thin route definitions + middleware
- Controllers: HTTP handling + validation
- Services: Business logic + database access

**Key Decisions:**
- Three-layer separation for maintainability
- Zod for all input validation (no manual checks)
- Prisma for type-safe database access
- Soft deletes (active flag) for data integrity

---

## Slide 10: Tech Stack Decisions - Frontend

### Modern React Stack Choices

**Core Stack:**
- **React + Vite + TypeScript**
  - Why: Fast dev server, excellent TypeScript support, modern tooling
- **Mantine UI**
  - Why: Built-in RTL support, comprehensive components, accessibility
- **TanStack Query (React Query)**
  - Why: Server state management, caching, optimistic updates
- **Day.js**
  - Why: Lightweight, immutable, timezone-aware

**Architecture Pattern:**
```
Components/Pages → Hooks → Services
```
- Components: Pure UI (no API calls)
- Hooks: Business logic + state management
- Services: API communication only

**Key Decisions:**
- Three-layer separation (mirrors backend)
- TanStack Query for all server state
- Mantine for consistent UI (no custom components)
- Path aliases (`@/`, `@components/`, `@shared/`) for clean imports

---

## Slide 11: Monorepo Structure

### Why Monorepo & How We Organize

**Structure:**
```
root/
├── backend/          # Express API server
├── frontend_user/    # Mobile-first React app
├── frontend_admin/   # Desktop-first React app
└── shared/           # Shared code between frontends
```

**Why Monorepo:**
- ✅ Easier dependency management
- ✅ Shared types and utilities
- ✅ Unified tooling and scripts
- ✅ Single repository for all services

**Shared Code Strategy:**
- `@shared/utils/ApiClient` - HTTP client with auto token injection
- `@shared/components/Login` - Reusable login component
- `@shared/context/AuthContext` - Shared authentication state
- `@shared/types/User` - Common TypeScript types

**Workspace Management:**
- Root `package.json` orchestrates all services
- `npm run dev:all` - Run everything
- `npm run dev:user` - Backend + User app
- `npm run dev:admin` - Backend + Admin app

---

## Slide 12: Key Architectural Decisions

### Patterns & Principles We Follow

**Backend Patterns:**
- **Three-Layer Architecture**: Routes → Controllers → Services
- **Zod Validation**: All inputs validated with schemas
- **Soft Deletes**: `active` flag instead of hard deletes
- **Error Handling**: `AppError` + `ApiResponse` utilities
- **No Business Logic in Controllers**: All logic in services

**Frontend Patterns:**
- **Three-Layer Architecture**: Components → Hooks → Services
- **TanStack Query**: All server state management
- **Mantine UI Only**: No custom UI components
- **Path Aliases**: Clean imports (`@components/`, `@hooks/`)
- **RTL Support**: Hebrew interface with proper direction

**Shared Principles:**
- TypeScript strict mode (no `any`)
- No inline styles
- Consistent naming conventions
- 60% test coverage target

---

## Slide 13: Decision-Making Examples

### Real Decisions We Made

**Example 1: Full-Stack Feature Ownership**
- **Problem**: How to enable parallel development?
- **Alternatives**: Backend/Frontend split, Feature-based without full-stack
- **Decision**: Each developer owns complete feature (API + UI)
- **Rationale**: Less coordination, faster debugging, better ownership

**Example 2: Monorepo vs. Multi-Repo**
- **Problem**: How to manage 3 services?
- **Alternatives**: Separate repositories, monorepo
- **Decision**: Monorepo with workspaces
- **Rationale**: Shared types, unified tooling, easier dependency management

**Example 3: Mantine UI vs. Custom Components**
- **Problem**: What UI library to use?
- **Alternatives**: Material-UI, Ant Design, Custom components, Mantine
- **Decision**: Mantine UI exclusively
- **Rationale**: Built-in RTL support, comprehensive components, accessibility

---

## Slide 14: Collaboration Tools & Practices

### How We Work Together

**Communication:**
- OpenSpec proposals for all feature discussions
- Code reviews via PR comments
- Design documents for architectural decisions

**Code Quality:**
- PR reviews required before merge
- Automated tests (unit + integration)
- Linting and TypeScript strict mode
- 60% test coverage target

**Documentation:**
- OpenSpec for requirements
- `ARCHITECTURE.md` for patterns
- `README.md` for setup
- Inline comments for complex logic

**Conflict Resolution:**
- Feature ownership reduces collisions
- Clear separation of concerns
- Regular PR reviews catch issues early

---

## Slide 15: Lessons Learned

### What Worked Well

**✅ OpenSpec Workflow**
- Clear requirements before coding
- Team alignment on features
- Living documentation

**✅ Full-Stack Feature Ownership**
- Minimal coordination overhead
- Faster development cycles
- Better debugging experience

**✅ Three-Layer Architecture**
- Clear separation of concerns
- Easy to test and maintain
- Consistent patterns

**✅ Monorepo Structure**
- Shared code reduces duplication
- Unified tooling simplifies setup
- Type safety across services

---

## Slide 16: Challenges & Solutions

### How We Overcame Obstacles

**Challenge 1: Parallel Development**
- **Solution**: Full-stack feature ownership + clear boundaries
- **Result**: Minimal merge conflicts, faster development

**Challenge 2: Type Safety Across Services**
- **Solution**: Shared types in `shared/` + Prisma generated types
- **Result**: Compile-time safety, fewer runtime errors

**Challenge 3: RTL Support**
- **Solution**: Mantine UI with built-in RTL + Hebrew text
- **Result**: Consistent RTL experience across all components

**Challenge 4: Testing Strategy**
- **Solution**: Unit tests (fast) + Integration tests (thorough)
- **Result**: 60% coverage with good confidence

---

## Slide 17: Tech Stack Summary

### Complete Technology Overview

**Backend:**
- Runtime: Node.js + Express
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod
- Testing: Vitest
- Auth: JWT (24h expiry)

**Frontend:**
- Framework: React + Vite
- Language: TypeScript
- UI Library: Mantine UI
- State: TanStack Query
- Forms: @mantine/form + Zod
- Dates: Day.js
- Routing: React Router

**DevOps:**
- CI/CD: GitHub Actions
- Deployment: Render
- Container: Docker (PostgreSQL)
- Package Manager: npm workspaces

---

## Slide 18: Key Takeaways

### What Makes This Project Successful

**1. Structured Decision-Making**
- Document decisions in `design.md`
- Evaluate alternatives before choosing
- Team consensus before implementation

**2. Spec-Driven Development**
- OpenSpec ensures clear requirements
- Approval gates prevent rework
- Living documentation stays current

**3. Effective Collaboration**
- Full-stack ownership reduces coordination
- Clear boundaries prevent conflicts
- PR reviews maintain quality

**4. Modern Tech Stack**
- TypeScript for type safety
- Prisma for database access
- TanStack Query for state management
- Mantine for consistent UI

**5. Automated Quality Gates**
- CI/CD runs tests automatically
- Coverage targets enforced
- Deployment after validation

---

## Slide 19: Project Statistics

### By The Numbers

**Codebase:**
- 3 services (backend, frontend_user, frontend_admin)
- Monorepo with shared code
- TypeScript throughout

**Testing:**
- Unit tests: Colocated with source
- Integration tests: Full workflows
- Coverage target: 60%

**Development:**
- 4 team members
- Full-stack feature ownership
- Branch-based workflow

**Process:**
- OpenSpec for all features
- Design docs for architecture
- PR reviews for quality

---

## Slide 20: Questions & Discussion

**Thank You!**

**Key Resources:**
- OpenSpec: `openspec/AGENTS.md`
- Architecture: `ARCHITECTURE.md`
- Testing: `TESTING_GUIDE.md`
- Setup: `README.md`

**Contact:**
- Repository: [GitHub Link]
- Documentation: `doc/` folder

---

## Appendix: OpenSpec Decision Tree

### When to Create a Proposal

```
New Request?
├─ Bug fix restoring spec behavior? → Fix directly
├─ Typo/format/comment? → Fix directly
├─ New feature/capability? → Create proposal
├─ Breaking change? → Create proposal
├─ Architecture change? → Create proposal
└─ Unclear? → Create proposal (safer)
```

**Proposal Required For:**
- New features or functionality
- Breaking changes (API, schema)
- Architecture or pattern changes
- Performance optimizations (behavior changes)
- Security pattern updates

**No Proposal Needed:**
- Bug fixes (restore intended behavior)
- Typos, formatting, comments
- Dependency updates (non-breaking)
- Configuration changes
- Tests for existing behavior

---

## Appendix: Git Workflow Diagram

```
┌─────────────────┐
│  feature/*      │  ← Developer creates branch
│  (development)  │
└────────┬────────┘
         │
         │ PR + Tests
         ▼
┌─────────────────┐
│      dev        │  ← Staging environment
│   (staging)     │
└────────┬────────┘
         │
         │ PR + Full Tests
         ▼
┌─────────────────┐
│      main       │  ← Production
│  (production)   │     Auto-deploy
└─────────────────┘
```

**CI/CD Triggers:**
- Push to `feature/*` → Unit tests
- PR to `dev` → Unit + Integration tests
- PR to `main` → Full test suite
- Merge to `main` → Deploy to production

---

## Appendix: Architecture Layers

### Backend Architecture

```
┌─────────────────────────────────────┐
│           Routes                     │
│  (HTTP paths + middleware)           │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Controllers                  │
│  (Request handling + validation)     │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          Services                   │
│  (Business logic + database)        │
└─────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────┐
│      Components/Pages                │
│  (UI only - no API calls)           │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           Hooks                      │
│  (Business logic + state)           │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Services                     │
│  (API calls only)                    │
└─────────────────────────────────────┘
```
