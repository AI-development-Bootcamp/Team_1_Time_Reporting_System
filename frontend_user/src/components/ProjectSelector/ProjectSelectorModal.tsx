/**
 * ProjectSelectorModal Component
 * Three-step wizard for selecting project, task, and location
 * 
 * Steps:
 * 1. Project selection (grouped by client)
 * 2. Task selection (filtered by selected project)
 * 3. Location selection (משרד / בית לקוח / בית)
 * 
 * Features:
 * - Dynamic title based on current step
 * - Back button (visible after step 1)
 * - Continue button with changing text
 * - Data fetching with React Query
 * - Mobile-first, RTL design
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Stack, Text, Loader, ScrollArea, ActionIcon } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getProjectSelector } from '../../services/projectSelectorApi';
import { ClientItem, ProjectItem, TaskItem, LocationStatus } from '../../types';
import { QUERY_KEYS, LOCATION_LABELS } from '../../utils/constants';
import classes from './ProjectSelectorModal.module.css';

interface ProjectSelectorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when selection is complete (clientId, projectId, taskId, location, reportingType) */
  onSelect: (selection: {
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    taskId: string;
    taskName: string;
    location: LocationStatus;
    reportingType: 'duration' | 'startEnd';
  }) => void;
  /** User ID for fetching project data */
  userId: string;
  /** Initial selection (for edit mode) */
  initialSelection?: {
    clientId?: string;
    projectId?: string;
    taskId?: string;
    location?: LocationStatus;
  };
}

type WizardStep = 1 | 2 | 3;

/**
 * ProjectSelectorModal - Three-step wizard for project selection
 * 
 * @example
 * <ProjectSelectorModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSelect={(selection) => {
 *     console.log('Selected:', selection);
 *     setIsOpen(false);
 *   }}
 *   userId={currentUserId}
 * />
 */
export function ProjectSelectorModal({
  isOpen,
  onClose,
  onSelect,
  userId,
  initialSelection,
}: ProjectSelectorModalProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  
  // Selection state
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationStatus | null>(null);

  // Fetch project selector data
  const { data, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.projectSelector, userId],
    queryFn: () => getProjectSelector(userId),
    enabled: isOpen && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset wizard when modal opens
  useEffect(() => {
    if (isOpen) {
      // Apply initial selection if provided
      if (initialSelection) {
        // TODO: Find and set selected client/project/task from initialSelection
        // For now, start from step 1
        setCurrentStep(1);
      } else {
        setCurrentStep(1);
        setSelectedClient(null);
        setSelectedProject(null);
        setSelectedTask(null);
        setSelectedLocation(null);
      }
    }
  }, [isOpen, initialSelection]);

  // Get title based on current step
  const getTitle = (): string => {
    switch (currentStep) {
      case 1:
        return 'בחר פרויקט';
      case 2:
        return 'בחר משימה';
      case 3:
        return 'בחר מיקום';
      default:
        return 'בחר פרויקט';
    }
  };

  // Get button text based on current step
  const getButtonText = (): string => {
    switch (currentStep) {
      case 1:
        return 'המשך ובחר משימה';
      case 2:
        return 'המשך ובחר מיקום';
      case 3:
        return 'המשך';
      default:
        return 'המשך';
    }
  };

  // Handle project selection (step 1)
  const handleProjectSelect = (client: ClientItem, project: ProjectItem) => {
    setSelectedClient(client);
    setSelectedProject(project);
    setSelectedTask(null);
    setSelectedLocation(null);
    setCurrentStep(2);
  };

  // Handle task selection (step 2)
  const handleTaskSelect = (task: TaskItem) => {
    setSelectedTask(task);
    setSelectedLocation(null);
    setCurrentStep(3);
  };

  // Handle location selection (step 3)
  const handleLocationSelect = (location: LocationStatus) => {
    setSelectedLocation(location);
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // Handle continue/finish button
  const handleContinue = () => {
    if (currentStep === 3 && selectedClient && selectedProject && selectedTask && selectedLocation) {
      // Final step - submit selection
      onSelect({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        taskId: selectedTask.id,
        taskName: selectedTask.name,
        location: selectedLocation,
        reportingType: selectedProject.reportingType,
      });
    }
  };

  // Check if continue button should be enabled
  const isContinueEnabled = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedProject !== null;
      case 2:
        return selectedTask !== null;
      case 3:
        return selectedLocation !== null;
      default:
        return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className={classes.loadingContainer}>
          <Loader size="lg" />
          <Text size="sm" c="dimmed" mt="md">
            טוען נתונים...
          </Text>
        </div>
      );
    }

    if (isError || !data) {
      return (
        <div className={classes.errorContainer}>
          <Text size="sm" c="red" ta="center">
            שגיאה בטעינת הנתונים
          </Text>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return renderProjectStep(data.clients);
      case 2:
        return renderTaskStep();
      case 3:
        return renderLocationStep();
      default:
        return null;
    }
  };

  // Render step 1: Project selection (grouped by client)
  const renderProjectStep = (clients: ClientItem[]) => {
    return (
      <ScrollArea className={classes.scrollArea}>
        <Stack gap="md">
          {clients.map((client) => (
            <div key={client.id} className={classes.clientGroup}>
              {/* Client Header */}
              <Text className={classes.clientName} size="sm" fw={600} mb="xs">
                {client.name}
              </Text>

              {/* Projects List */}
              <Stack gap="xs">
                {client.projects.map((project) => (
                  <button
                    key={project.id}
                    className={`${classes.itemButton} ${
                      selectedProject?.id === project.id ? classes.selected : ''
                    }`}
                    onClick={() => handleProjectSelect(client, project)}
                  >
                    <div className={classes.itemContent}>
                      <Text size="sm" fw={500}>
                        {project.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {project.tasks.length} משימות
                      </Text>
                    </div>
                    {selectedProject?.id === project.id && (
                      <IconArrowRight size={20} className={classes.selectedIcon} />
                    )}
                  </button>
                ))}
              </Stack>
            </div>
          ))}

          {clients.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              אין פרויקטים זמינים
            </Text>
          )}
        </Stack>
      </ScrollArea>
    );
  };

  // Render step 2: Task selection
  const renderTaskStep = () => {
    if (!selectedProject) {
      return (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          לא נבחר פרויקט
        </Text>
      );
    }

    return (
      <ScrollArea className={classes.scrollArea}>
        <Stack gap="xs">
          {selectedProject.tasks.map((task) => (
            <button
              key={task.id}
              className={`${classes.itemButton} ${
                selectedTask?.id === task.id ? classes.selected : ''
              }`}
              onClick={() => handleTaskSelect(task)}
            >
              <div className={classes.itemContent}>
                <Text size="sm" fw={500}>
                  {task.name}
                </Text>
              </div>
              {selectedTask?.id === task.id && (
                <IconArrowRight size={20} className={classes.selectedIcon} />
              )}
            </button>
          ))}

          {selectedProject.tasks.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              אין משימות זמינות
            </Text>
          )}
        </Stack>
      </ScrollArea>
    );
  };

  // Render step 3: Location selection
  const renderLocationStep = () => {
    const locations: LocationStatus[] = ['office', 'client', 'home'];

    return (
      <ScrollArea className={classes.scrollArea}>
        <Stack gap="xs">
          {locations.map((location) => (
            <button
              key={location}
              className={`${classes.itemButton} ${
                selectedLocation === location ? classes.selected : ''
              }`}
              onClick={() => handleLocationSelect(location)}
            >
              <div className={classes.itemContent}>
                <Text size="sm" fw={500}>
                  {LOCATION_LABELS[location]}
                </Text>
              </div>
              {selectedLocation === location && (
                <IconArrowRight size={20} className={classes.selectedIcon} />
              )}
            </button>
          ))}
        </Stack>
      </ScrollArea>
    );
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="md"
      centered
      classNames={{
        title: classes.modalTitle,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <Stack gap="lg">
        {/* Step Content */}
        <div className={classes.contentContainer}>{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className={classes.navigationContainer}>
          {/* Back Button (visible after step 1) */}
          {currentStep > 1 && (
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={handleBack}
              className={classes.backButton}
            >
              <IconArrowRight size={20} />
            </ActionIcon>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!isContinueEnabled()}
            size="lg"
            className={classes.continueButton}
            flex={1}
          >
            {getButtonText()}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
