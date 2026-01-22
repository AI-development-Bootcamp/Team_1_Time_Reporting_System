/**
 * ProjectReportCard Component
 * Expandable card for single project report entry
 * 
 * Features:
 * - Collapsed view: Project name + duration
 * - Expanded view: All fields (project, task, location, time, description)
 * - Accordion behavior (click to toggle)
 * - Delete button
 * - Mobile-first, RTL design
 */

import { useState } from 'react';
import { TextInput, Textarea, Button, Text, Stack } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { ProjectReportItem, TaskLookupMap } from '../../types';
import { LOCATION_LABELS } from '../../utils/constants';
import { formatDurationHours } from '../../utils/dateUtils';
import classes from './ProjectReportCard.module.css';

interface ProjectReportCardProps {
  /** Project report data */
  report: ProjectReportItem;
  /** Index in the list (for display) */
  index: number;
  /** Callback when report is updated */
  onUpdate: (updatedReport: ProjectReportItem) => void;
  /** Callback when delete is requested */
  onDelete: () => void;
  /** Task lookup map for project/task metadata */
  taskLookup: TaskLookupMap;
}

/**
 * ProjectReportCard - Expandable project time log card
 * 
 * @example
 * <ProjectReportCard
 *   report={projectReport}
 *   index={0}
 *   onUpdate={(updated) => handleUpdate(updated)}
 *   onDelete={() => handleDelete()}
 *   taskLookup={taskLookup}
 * />
 */
export function ProjectReportCard({
  report,
  index: _index,
  onUpdate,
  onDelete,
  taskLookup: _taskLookup,
}: ProjectReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(report.isExpanded ?? false);

  // Toggle expansion
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onUpdate({ ...report, isExpanded: newExpanded });
  };

  // Handle field updates
  const handleFieldUpdate = (field: keyof ProjectReportItem, value: any) => {
    onUpdate({ ...report, [field]: value });
  };

  // Handle delete with confirmation
  const handleDeleteClick = () => {
    // TODO: Replace with DeleteProjectConfirmModal (future task)
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את דיווח הפרויקט?');
    if (confirmed) {
      onDelete();
    }
  };

  // Format duration for display
  const getDurationDisplay = (): string => {
    if (report.duration !== undefined) {
      // Duration-based project
      return formatDurationHours(report.duration);
    } else if (report.startTime && report.endTime) {
      // StartEnd-based project - calculate duration
      const [startH, startM] = report.startTime.split(':').map(Number);
      const [endH, endM] = report.endTime.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      return formatDurationHours(durationMinutes);
    }
    return '00:00';
  };

  const durationDisplay = getDurationDisplay();
  const locationLabel = LOCATION_LABELS[report.location] || report.location;

  return (
    <div className={`${classes.card} ${isExpanded ? classes.expanded : ''}`}>
      {/* Collapsed View - Click to Expand */}
      <div className={classes.header} onClick={handleToggle}>
        <div className={classes.headerContent}>
          <Text size="sm" fw={600}>
            {report.projectName || 'לא נבחר פרויקט'}
          </Text>
          <Text size="sm" c="dimmed">
            {durationDisplay} ש'
          </Text>
        </div>
        <div className={classes.headerIcon}>
          {isExpanded ? (
            <IconChevronUp size={20} />
          ) : (
            <IconChevronDown size={20} />
          )}
        </div>
      </div>

      {/* Expanded View - All Fields */}
      {isExpanded && (
        <div className={classes.body}>
          <Stack gap="md">
            {/* Project Selection */}
            <div className={classes.field}>
              <Text size="sm" fw={500} mb="xs">
                פרויקט<span className={classes.required}>*</span>
              </Text>
              <TextInput
                value={report.projectName || ''}
                readOnly
                placeholder="בחר פרויקט"
                className={classes.input}
                onClick={() => {
                  // TODO: Open ProjectSelectorModal (TASK-M2-020-FE-017)
                  alert('ProjectSelectorModal - Coming soon');
                }}
              />
            </div>

            {/* Task Selection */}
            <div className={classes.field}>
              <Text size="sm" fw={500} mb="xs">
                משימה<span className={classes.required}>*</span>
              </Text>
              <TextInput
                value={report.taskName || ''}
                readOnly
                placeholder="בחר משימה"
                className={classes.input}
                disabled={!report.projectId}
                onClick={() => {
                  if (report.projectId) {
                    // TODO: Open TaskListStep (TASK-M2-020-FE-018)
                    alert('TaskListStep - Coming soon');
                  }
                }}
              />
            </div>

            {/* Location Selection */}
            <div className={classes.field}>
              <Text size="sm" fw={500} mb="xs">
                מיקום<span className={classes.required}>*</span>
              </Text>
              <TextInput
                value={locationLabel}
                readOnly
                placeholder="בחר מיקום"
                className={classes.input}
                disabled={!report.taskId}
                onClick={() => {
                  if (report.taskId) {
                    // TODO: Open LocationListStep (TASK-M2-020-FE-019)
                    alert('LocationListStep - Coming soon');
                  }
                }}
              />
            </div>

            {/* Time Entry - Duration or StartEnd based on reportingType */}
            {report.reportingType === 'duration' ? (
              /* Duration Input */
              <div className={classes.field}>
                <Text size="sm" fw={500} mb="xs">
                  משך זמן<span className={classes.required}>*</span>
                </Text>
                <TextInput
                  value={report.duration ? `${Math.floor(report.duration / 60)}:${(report.duration % 60).toString().padStart(2, '0')}` : ''}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    // Parse HH:mm to minutes
                    const match = value.match(/^(\d{1,2}):(\d{2})$/);
                    if (match) {
                      const hours = parseInt(match[1]);
                      const minutes = parseInt(match[2]);
                      const totalMinutes = hours * 60 + minutes;
                      if (totalMinutes <= 23 * 60 + 59) {
                        handleFieldUpdate('duration', totalMinutes);
                      }
                    }
                  }}
                  placeholder="HH:mm (max 23:59)"
                  dir="ltr"
                  className={classes.input}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  פורמט: HH:mm (לדוגמה: 05:30)
                </Text>
              </div>
            ) : (
              /* StartEnd Inputs */
              <>
                <div className={classes.field}>
                  <Text size="sm" fw={500} mb="xs">
                    שעת התחלה<span className={classes.required}>*</span>
                  </Text>
                  <TextInput
                    value={report.startTime || ''}
                    onChange={(e) => handleFieldUpdate('startTime', e.currentTarget.value)}
                    placeholder="HH:mm"
                    dir="ltr"
                    className={classes.input}
                  />
                </div>
                <div className={classes.field}>
                  <Text size="sm" fw={500} mb="xs">
                    שעת סיום<span className={classes.required}>*</span>
                  </Text>
                  <TextInput
                    value={report.endTime || ''}
                    onChange={(e) => handleFieldUpdate('endTime', e.currentTarget.value)}
                    placeholder="HH:mm"
                    dir="ltr"
                    className={classes.input}
                  />
                </div>
              </>
            )}

            {/* Description (Optional) */}
            <div className={classes.field}>
              <Text size="sm" fw={500} mb="xs">
                תיאור (אופציונלי)
              </Text>
              <Textarea
                value={report.description || ''}
                onChange={(e) => handleFieldUpdate('description', e.currentTarget.value)}
                placeholder="הוסף תיאור למשימה..."
                rows={3}
                className={classes.textarea}
              />
            </div>

            {/* Delete Button */}
            <div className={classes.actions}>
              <Button
                variant="subtle"
                color="red"
                onClick={handleDeleteClick}
                className={classes.deleteButton}
              >
                מחיקת פרויקט
              </Button>
            </div>
          </Stack>
        </div>
      )}
    </div>
  );
}
