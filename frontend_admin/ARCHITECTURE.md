# Frontend Admin Architecture Guide

## Overview

This document describes the frontend architecture patterns, best practices, and available utilities for the Admin application.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary/  # Error handling wrapper
│   ├── Layout/         # Layout components (AppLayout, etc.)
│   └── ReportingSettings/  # Feature-specific components
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useConfirmAction.ts
│   ├── useFormHandler.ts
│   └── useReportingSettings.ts
├── pages/              # Page-level components (routes)
├── services/           # API service layer
│   ├── ClientService.ts
│   ├── ProjectService.ts
│   └── index.ts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── validation.ts
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

## Path Aliases

The following path aliases are configured for cleaner imports:

- `@/` - src directory root
- `@components/` - components directory
- `@hooks/` - hooks directory
- `@pages/` - pages directory
- `@services/` - services directory
- `@types/` - types directory
- `@utils/` - utils directory
- `@shared/` - shared directory (monorepo)

**Example:**
```typescript
// ❌ Before
import { projectService } from '../../../services/ProjectService';

// ✅ After
import { projectService } from '@services';
```

## Architecture Layers

### 1. Service Layer (`@services/`)

The service layer encapsulates all API communication. Each service class provides methods for interacting with specific backend resources.

**Principles:**
- One service class per resource (Project, Client, etc.)
- All HTTP requests go through services
- Services use the shared `ApiClient` from `@shared/utils/ApiClient`
- Return typed responses

**Example:**
```typescript
// services/ProjectService.ts
export class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/admin/projects');
    return response.data;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const response = await apiClient.put<Project>(`/admin/projects/${id}`, data);
    return response.data;
  }
}

export const projectService = new ProjectService();
```

### 2. Custom Hooks Layer (`@hooks/`)

Custom hooks handle business logic, state management, and side effects. They use services for data fetching.

**Types of hooks:**

#### Data Fetching Hooks
Use TanStack Query for server state management.

```typescript
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });
}
```

#### Form Handling Hooks
Use `useFormHandler` for forms with mutations.

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

### 3. Component Layer (`@components/`, `@pages/`)

Components are pure presentation. They receive data and callbacks from hooks.

**Principles:**
- No direct API calls in components
- Use hooks for all data and business logic
- Keep components focused on UI
- No inline styles (use Mantine props)

**Example:**
```typescript
// pages/ProjectsPage.tsx
export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) return <Loader />;

  return (
    <Stack>
      {projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Stack>
  );
}
```

## Key Patterns

### Error Boundary

All routes are wrapped in an ErrorBoundary that catches React errors and displays a user-friendly fallback UI.

```typescript
// App.tsx
<ErrorBoundary>
  <BrowserRouter>
    <Routes>...</Routes>
  </BrowserRouter>
</ErrorBoundary>
```

### Form Management

Use `useFormHandler` for all forms that involve server mutations:

```typescript
function CreateClientForm() {
  const { form, handleSubmit, isSubmitting } = useFormHandler({
    form: {
      initialValues: {
        name: '',
        email: '',
        phone: '',
      },
      validate: {
        name: validateRequired('שם'),
        email: validateEmail,
        phone: validatePhone,
      },
    },
    mutationFn: (values) => clientService.createClient(values),
    invalidateQueries: [['clients']],
    successMessage: 'הלקוח נוסף בהצלחה',
  });

  return (
    <form onSubmit={handleSubmit}>
      <TextInput label="שם" {...form.getInputProps('name')} />
      <TextInput label="אימייל" {...form.getInputProps('email')} />
      <TextInput label="טלפון" {...form.getInputProps('phone')} />
      <Button type="submit" loading={isSubmitting}>שמור</Button>
    </form>
  );
}
```

### Confirmation Dialogs

Use `useConfirmAction` for destructive operations:

```typescript
function DeleteButton({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const confirmDelete = useConfirmAction({
    title: 'מחיקת פרויקט',
    message: 'האם אתה בטוח? פעולה זו אינה הפיכה.',
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDelete = async () => {
    const confirmed = await confirmDelete();
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <Button color="red" onClick={handleDelete} loading={deleteMutation.isPending}>
      מחק
    </Button>
  );
}
```

### Validation

Use validation utilities from `@utils/validation`:

```typescript
import {
  validateRequired,
  validateEmail,
  validateMinLength,
  composeValidators,
} from '@utils/validation';

const form = useForm({
  initialValues: { ... },
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

## State Management Strategy

### Server State
- **Tool**: TanStack Query
- **Usage**: All data from the backend
- **Benefits**: Automatic caching, background refetching, optimistic updates

### UI State
- **Tool**: React useState, useReducer
- **Usage**: Local component state (modals, forms, filters)
- **Scope**: Keep as local as possible

### Global State
- **Tool**: React Context (if needed)
- **Usage**: Truly global UI state (theme, auth user)
- **Rule**: Minimize usage, prefer composition

## Best Practices

### DO ✅
- Use path aliases for imports
- Keep services thin (just API calls)
- Keep hooks focused (one responsibility)
- Use TypeScript strictly (no `any`)
- Validate forms with Mantine Form + validation utils
- Invalidate queries after mutations
- Use Hebrew for user-facing messages
- Handle loading and error states
- Use Mantine components (no custom UI)

### DON'T ❌
- Make API calls directly in components
- Use inline styles (`style={{...}}`)
- Mix Hebrew and English in user messages
- Use `any` type
- Forget to invalidate queries after mutations
- Create custom UI components (use Mantine)
- Mix business logic in components

## Migration Guide

If you have existing code that doesn't follow these patterns:

### 1. Move API calls to services

```typescript
// ❌ Before: API call in component
const handleUpdate = async () => {
  await axios.patch(`/api/projects/${id}`, data);
};

// ✅ After: Use service
const mutation = useMutation({
  mutationFn: (data) => projectService.updateProject(id, data),
});
```

### 2. Extract business logic to hooks

```typescript
// ❌ Before: Logic in component
function Component() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/projects').then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, []);
}

// ✅ After: Use custom hook with TanStack Query
function Component() {
  const { data, isLoading } = useProjects();
}
```

### 3. Use new path aliases

```typescript
// ❌ Before
import { Project } from '../../../types/Project';
import { projectService } from '../../../services/ProjectService';

// ✅ After
import type { Project } from '@types/Project';
import { projectService } from '@services';
```

## Dependencies

### Required Packages
- `@mantine/core` - UI components
- `@mantine/form` - Form management
- `@mantine/hooks` - Utility hooks
- `@mantine/modals` - Modal dialogs
- `@mantine/notifications` - Toast notifications
- `@tanstack/react-query` - Server state management
- `react-router-dom` - Routing
- `axios` - HTTP client
- `dayjs` - Date utilities

### Package Installation

After pulling these changes, run:
```bash
cd frontend_admin
npm install
```

## Additional Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Mantine Documentation](https://mantine.dev/)
- [React Router Docs](https://reactrouter.com/)
- Custom Hooks Documentation: `src/hooks/README.md`
