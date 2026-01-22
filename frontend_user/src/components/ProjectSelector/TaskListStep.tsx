/**
 * TaskListStep Component
 * Step 2 of project selector: Display tasks for selected project
 * 
 * Features:
 * - Context subtitle showing project name
 * - Filtered task list
 * - Blue checkmark for selected task
 * - Mobile-first, RTL design
 */

import { Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { TaskItem } from '../../types';
import classes from './TaskListStep.module.css';

interface TaskListStepProps {
  /** Array of tasks to display */
  tasks: TaskItem[];
  /** Currently selected task ID */
  selectedId: string | null;
  /** Callback when a task is selected */
  onSelect: (task: TaskItem) => void;
  /** Project name for context subtitle */
  projectName: string;
}

/**
 * TaskListStep - Display tasks for selected project
 * 
 * @example
 * <TaskListStep
 *   tasks={selectedProject.tasks}
 *   selectedId={selectedTaskId}
 *   onSelect={(task) => handleTaskSelect(task)}
 *   projectName={selectedProject.name}
 * />
 */
export function TaskListStep({
  tasks,
  selectedId,
  onSelect,
  projectName,
}: TaskListStepProps) {
  // Render empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.contextSubtitle}>
          <Text size="xs" c="dimmed" ta="center">
            פרויקט: {projectName}
          </Text>
        </div>
        <div className={classes.emptyState}>
          <Text size="sm" c="dimmed" ta="center">
            אין משימות זמינות לפרויקט זה
          </Text>
        </div>
      </div>
    );
  }

  // Render task list
  return (
    <div className={classes.container}>
      {/* Context Subtitle */}
      <div className={classes.contextSubtitle}>
        <Text size="xs" c="dimmed" ta="center">
          פרויקט: {projectName}
        </Text>
      </div>

      {/* Tasks List */}
      <Stack gap="xs">
        {tasks.map((task) => {
          const isSelected = selectedId === task.id;

          return (
            <button
              key={task.id}
              className={`${classes.taskButton} ${
                isSelected ? classes.selected : ''
              }`}
              onClick={() => onSelect(task)}
              type="button"
            >
              <div className={classes.taskContent}>
                <Text size="sm" fw={500}>
                  {task.name}
                </Text>
              </div>
              {isSelected && (
                <IconCheck size={20} className={classes.checkIcon} />
              )}
            </button>
          );
        })}
      </Stack>
    </div>
  );
}
