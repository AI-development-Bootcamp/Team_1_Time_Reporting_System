# Custom Hooks Documentation

This directory contains custom React hooks that provide reusable functionality across the application.

## Data Fetching Hooks

### `useReportingSettings`

Manages fetching and updating project reporting settings with optimistic updates.

**Features:**
- Fetches projects with joined client data
- Optimistic UI updates
- Automatic rollback on error
- Query invalidation on success

**Example Usage:**

```typescript
import { useReportingSettings } from '@hooks/useReportingSettings';

function ReportingSettingsPage() {
  const {
    projects,
    isLoading,
    isError,
    updateReportingType,
    isUpdating,
  } = useReportingSettings();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading projects</div>;

  return (
    <div>
      {projects.map((project) => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>Client: {project.client.name}</p>
          <button
            onClick={() => updateReportingType({
              projectId: project.id,
              reportingType: 'duration'
            })}
            disabled={isUpdating}
          >
            Change to Duration
          </button>
        </div>
      ))}
    </div>
  );
}
```

### `useAuth`

Provides authenticated user information from localStorage with cross-tab synchronization.

**Example Usage:**

```typescript
import { useAuth } from '@hooks/useAuth';

function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Email: {user.mail}</p>
      <p>Type: {user.userType}</p>
    </div>
  );
}
```

## Best Practices

1. **Always use services in hooks**: Don't make direct API calls in hooks. Use the service layer.
2. **Invalidate queries after mutations**: Ensure the UI stays in sync with the server.
3. **Use optimistic updates carefully**: Only for simple updates where rollback is easy (as shown in useReportingSettings).
4. **Provide clear error messages**: Use Hebrew messages that are user-friendly.

## Future Additions

When you need to add forms or confirmation dialogs, consider creating:
- `useFormHandler` - For form management with mutations
- `useConfirmAction` - For confirmation dialogs before destructive actions
