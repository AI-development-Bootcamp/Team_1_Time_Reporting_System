# Time Reporting System - Architecture Guide

This document describes the code architecture patterns that all developers should follow.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Shared Code](#shared-code)

---

## Project Structure

```
root/
├── backend/                 # Express API server
│   └── src/
├── frontend_admin/          # Admin panel application
│   └── src/
├── frontend_user/           # User application
│   └── src/
└── shared/                  # Shared code across frontends
    ├── src/utils/          # Shared utilities (ApiClient)
    └── image_components/   # Shared images/assets
```

---

## Frontend Architecture

All frontend applications (`frontend_admin`, `frontend_user`) follow the same architecture patterns.

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary/  # Error handling wrapper
│   ├── Layout/         # Layout components
│   └── [Feature]/      # Feature-specific components
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useFormHandler.ts
│   └── use[Feature].ts
├── pages/              # Page-level components (routes)
├── services/           # API service layer
│   ├── [Resource]Service.ts
│   └── index.ts        # Re-exports all services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── validation.ts
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

### Path Aliases

Use path aliases for cleaner imports:

| Alias | Path |
|-------|------|
| `@/` | src/ |
| `@components/` | src/components/ |
| `@hooks/` | src/hooks/ |
| `@pages/` | src/pages/ |
| `@services/` | src/services/ |
| `@types/` | src/types/ |
| `@utils/` | src/utils/ |
| `@shared/` | shared/ (monorepo) |

```typescript
// ❌ Don't
import { projectService } from '../../../services/ProjectService';

// ✅ Do
import { projectService } from '@services';
```

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Components/Pages                   │
│         (UI only - no API calls or logic)           │
└─────────────────────────┬───────────────────────────┘
                          │ uses
┌─────────────────────────▼───────────────────────────┐
│                      Hooks                           │
│      (business logic, state management, effects)    │
└─────────────────────────┬───────────────────────────┘
                          │ uses
┌─────────────────────────▼───────────────────────────┐
│                     Services                         │
│            (API calls only - no logic)              │
└─────────────────────────────────────────────────────┘
```

#### Layer 1: Service Layer (`@services/`)

Encapsulates all API communication. One service class per resource.

**Principles:**
- All HTTP requests go through services
- Services use the shared `ApiClient` from `@shared/utils/ApiClient`
- Return typed responses
- No business logic - just API calls

```typescript
// services/ProjectService.ts
import { apiClient } from '@shared/utils/ApiClient';
import type { Project } from '@types/Project';

export class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/admin/projects');
    return response.data;
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    const response = await apiClient.post<Project>('/admin/projects', data);
    return response.data;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const response = await apiClient.put<Project>(`/admin/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await apiClient.delete(`/admin/projects/${id}`);
  }
}

export const projectService = new ProjectService();
```

#### Layer 2: Hooks Layer (`@hooks/`)

Handles business logic, state management, and side effects.

**Data Fetching Hooks** - Use TanStack Query:
```typescript
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@services';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });
}
```

**Mutation Hooks** - For create/update/delete:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

**Form Hooks** - Use `useFormHandler` for forms with mutations:
```typescript
const { form, handleSubmit, isSubmitting } = useFormHandler({
  form: {
    initialValues: { name: '', email: '' },
    validate: {
      name: validateRequired('שם'),
      email: validateEmail,
    },
  },
  mutationFn: (values) => clientService.createClient(values),
  invalidateQueries: [['clients']],
  successMessage: 'הלקוח נוצר בהצלחה!',
});
```

#### Layer 3: Component Layer (`@components/`, `@pages/`)

Pure presentation components that receive data and callbacks from hooks.

**Principles:**
- No direct API calls in components
- Use hooks for all data and business logic
- Keep components focused on UI
- No inline styles (use Mantine props)

```typescript
// pages/ProjectsPage.tsx
export function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Stack>
      {projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Stack>
  );
}
```

### State Management Strategy

| Type | Tool | Usage |
|------|------|-------|
| Server State | TanStack Query | All data from the backend |
| UI State | React useState/useReducer | Local component state (modals, forms, filters) |
| Global State | React Context | Truly global UI state (theme, auth) - minimize usage |

### Key Patterns

#### Error Boundary
```typescript
<ErrorBoundary>
  <BrowserRouter>
    <Routes>...</Routes>
  </BrowserRouter>
</ErrorBoundary>
```

#### Confirmation Dialogs
```typescript
const confirmDelete = useConfirmAction({
  title: 'מחיקת פרויקט',
  message: 'האם אתה בטוח? פעולה זו אינה הפיכה.',
});

const handleDelete = async () => {
  const confirmed = await confirmDelete();
  if (confirmed) {
    deleteMutation.mutate();
  }
};
```

#### Form Validation
```typescript
import { validateRequired, validateEmail, composeValidators } from '@utils/validation';

const form = useForm({
  validate: {
    name: validateRequired('שם'),
    email: validateEmail,
    password: composeValidators(
      validateRequired('סיסמה'),
      validateMinLength(8, 'סיסמה')
    ),
  },
});
```

### Frontend Best Practices

#### DO ✅
- Use path aliases for imports
- Keep services thin (just API calls)
- Keep hooks focused (one responsibility)
- Use TypeScript strictly (no `any`)
- Invalidate queries after mutations
- Handle loading and error states
- Use Mantine components (no custom UI)

#### DON'T ❌
- Make API calls directly in components
- Use inline styles (`style={{...}}`)
- Use `any` type
- Forget to invalidate queries after mutations
- Mix business logic in components

---

## Backend Architecture

### Directory Structure

```
backend/src/
├── controllers/        # Route handlers - orchestrate services
│   ├── AuthController.ts
│   ├── UserController.ts
│   └── ...
├── services/           # Business logic layer
│   ├── AuthService.ts
│   ├── UserService.ts
│   └── ...
├── routes/             # Route definitions
│   ├── auth.routes.ts
│   ├── admin.routes.ts
│   └── index.ts
├── middleware/         # Express middleware
│   ├── ErrorHandler.ts
│   ├── AuthMiddleware.ts
│   └── ValidationMiddleware.ts
├── validators/         # Zod validation schemas
│   ├── auth.schema.ts
│   ├── user.schema.ts
│   └── ...
├── utils/              # Utility functions
│   └── Response.ts
└── index.ts            # App entry point
```

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                      Routes                          │
│          (define paths, chain middleware)           │
└─────────────────────────┬───────────────────────────┘
                          │ calls
┌─────────────────────────▼───────────────────────────┐
│                    Controllers                       │
│     (handle HTTP, validate input, call services)    │
└─────────────────────────┬───────────────────────────┘
                          │ calls
┌─────────────────────────▼───────────────────────────┐
│                     Services                         │
│       (business logic, database operations)         │
└─────────────────────────────────────────────────────┘
```

#### Layer 1: Routes (`routes/`)

Define route paths and chain middleware + controllers.

```typescript
// routes/admin.routes.ts
import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/AuthMiddleware';
import { UserController } from '../controllers/UserController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', UserController.getUsers);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

export default router;
```

#### Layer 2: Controllers (`controllers/`)

Handle HTTP requests, validate input, call services, send responses.

**Principles:**
- Parse and validate request data
- Call appropriate service methods
- Use `ApiResponse` utility for responses
- Handle errors with `AppError`

```typescript
// controllers/UserController.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../utils/Response';
import { createUserSchema } from '../validators/user.schema';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { active } = req.query;
      const users = await UserService.getUsers({ 
        active: active === 'true' ? true : active === 'false' ? false : undefined 
      });
      ApiResponse.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await UserService.createUser(data);
      ApiResponse.success(res, { id: user.id }, 201);
    } catch (error) {
      next(error);
    }
  }
}
```

#### Layer 3: Services (`services/`)

Contains business logic. Interacts with Prisma for database operations.

**Principles:**
- All business logic lives here
- No HTTP-related code (no req/res)
- Use Prisma for database operations
- Throw `AppError` for domain errors

```typescript
// services/UserService.ts
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/ErrorHandler';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
  static async getUsers(filters: { active?: boolean }) {
    return prisma.user.findMany({
      where: filters.active !== undefined ? { active: filters.active } : {},
      select: {
        id: true,
        name: true,
        mail: true,
        userType: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async createUser(data: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { mail: data.mail },
    });
    
    if (existing) {
      throw new AppError('CONFLICT', 'Email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
  }
}
```

#### Cross-Cutting: Middleware (`middleware/`)

Express middleware for authentication, error handling, etc.

```typescript
// middleware/AuthMiddleware.ts
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid token', 401);
  }
};
```

#### Validators (`validators/`)

Zod schemas for request validation.

```typescript
// validators/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mail: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['worker', 'admin']),
});
```

### Backend Best Practices

#### DO ✅
- Use Zod for all input validation
- Use `ApiResponse` utility for consistent responses
- Use `AppError` for domain errors
- Keep business logic in services
- Use Prisma for database operations

#### DON'T ❌
- Put business logic in controllers
- Access `req`/`res` in services
- Skip input validation

---

## Shared Code

### `@shared/utils/ApiClient`

Shared HTTP client used by all frontends.

**Features:**
- Automatic token injection from localStorage
- Automatic 401 handling (redirect to login)
- Typed responses
- Fallback URL support

```typescript
import { apiClient } from '@shared/utils/ApiClient';

const response = await apiClient.get<Project[]>('/admin/projects');
const response = await apiClient.post<Project>('/admin/projects', data);
const response = await apiClient.put<Project>('/admin/projects/1', data);
await apiClient.delete('/admin/projects/1');
```

### Shared Assets

Static assets (images, logos) are stored in `shared/image_components/`.
