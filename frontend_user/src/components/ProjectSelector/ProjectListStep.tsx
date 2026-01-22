/**
 * ProjectListStep Component
 * Step 1 of project selector: Display projects grouped by client
 * 
 * Features:
 * - Projects grouped by client (section headers)
 * - Clickable project items
 * - Blue checkmark for selected project
 * - Loading skeleton
 * - Mobile-first, RTL design
 */

import { Stack, Text, Skeleton } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { ClientItem, ProjectItem } from '../../types';
import classes from './ProjectListStep.module.css';

interface ProjectListStepProps {
  /** Array of clients with nested projects */
  clients: ClientItem[];
  /** Currently selected project ID */
  selectedId: string | null;
  /** Callback when a project is selected */
  onSelect: (client: ClientItem, project: ProjectItem) => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * ProjectListStep - Display projects grouped by client
 * 
 * @example
 * <ProjectListStep
 *   clients={clientsData}
 *   selectedId={selectedProjectId}
 *   onSelect={(client, project) => handleProjectSelect(client, project)}
 *   isLoading={false}
 * />
 */
export function ProjectListStep({
  clients,
  selectedId,
  onSelect,
  isLoading = false,
}: ProjectListStepProps) {
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={classes.container}>
        <Stack gap="md">
          {[1, 2, 3].map((i) => (
            <div key={i} className={classes.skeletonGroup}>
              <Skeleton height={20} width="40%" mb="xs" />
              <Stack gap="xs">
                <Skeleton height={56} />
                <Skeleton height={56} />
              </Stack>
            </div>
          ))}
        </Stack>
      </div>
    );
  }

  // Render empty state
  if (!clients || clients.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.emptyState}>
          <Text size="sm" c="dimmed" ta="center">
            אין פרויקטים זמינים
          </Text>
        </div>
      </div>
    );
  }

  // Render client groups with projects
  return (
    <div className={classes.container}>
      <Stack gap="md">
        {clients.map((client) => (
          <div key={client.id} className={classes.clientGroup}>
            {/* Client Header */}
            <Text className={classes.clientName} size="sm" fw={600} mb="xs">
              {client.name}
            </Text>

            {/* Projects List */}
            <Stack gap="xs">
              {client.projects.map((project) => {
                const isSelected = selectedId === project.id;

                return (
                  <button
                    key={project.id}
                    className={`${classes.projectButton} ${
                      isSelected ? classes.selected : ''
                    }`}
                    onClick={() => onSelect(client, project)}
                    type="button"
                  >
                    <div className={classes.projectContent}>
                      <Text size="sm" fw={500}>
                        {project.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {project.tasks.length} משימות
                      </Text>
                    </div>
                    {isSelected && (
                      <IconCheck size={20} className={classes.checkIcon} />
                    )}
                  </button>
                );
              })}

              {/* Empty projects message */}
              {client.projects.length === 0 && (
                <Text size="xs" c="dimmed" ta="center" py="sm">
                  אין פרויקטים ללקוח זה
                </Text>
              )}
            </Stack>
          </div>
        ))}
      </Stack>
    </div>
  );
}
