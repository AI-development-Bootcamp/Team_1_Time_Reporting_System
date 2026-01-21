import { FC, useEffect } from 'react';
import {
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
  Textarea,
  Text,
  ActionIcon,
  Box,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconX, IconPlus } from '@tabler/icons-react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks, Task } from '../../hooks/useTasks';
import '../../styles/components/TaskForm.css';

export interface CreateTaskInput {
  name: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface TaskFormProps {
  opened: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialTask?: Task | null;
  initialProjectId?: string | null;
  onSubmit: (values: CreateTaskInput) => void;
  submitting?: boolean;
}

export const TaskForm: FC<TaskFormProps> = ({
  opened,
  onClose,
  mode,
  initialTask,
  initialProjectId,
  onSubmit,
  submitting = false,
}) => {
  const { projectsQuery } = useProjects();
  const projects = projectsQuery.data ?? [];

  const form = useForm({
    initialValues: {
      name: '',
      projectId: initialProjectId || '',
      startDate: '',
      endDate: '',
      description: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'שם המשימה נדרש' : null),
      projectId: (value) => (value.length === 0 ? 'פרויקט נדרש' : null),
    },
  });

  useEffect(() => {
    const formatDateForInput = (value?: string | null) => {
      if (!value) return '';
      // Backend returns ISO strings (e.g. "2026-01-21T00:00:00.000Z"),
      // but the <input type="date"> and backend validators expect "YYYY-MM-DD"
      return value.split('T')[0] ?? value;
    };

    if (mode === 'edit' && initialTask) {
      form.setValues({
        name: initialTask.name ?? '',
        projectId: initialTask.projectId ?? '',
        startDate: formatDateForInput(initialTask.startDate),
        endDate: formatDateForInput(initialTask.endDate),
        description: initialTask.description ?? '',
      });
    } else if (mode === 'create' && initialProjectId) {
      form.setFieldValue('projectId', initialProjectId);
    } else {
      form.reset();
    }
  }, [mode, initialTask, initialProjectId, opened]);

  const handleSubmit = form.onSubmit((values) => {
    onSubmit({
      name: values.name,
      projectId: values.projectId,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      description: values.description || undefined,
    });
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="lg"
      withCloseButton={false}
      styles={{
        content: {
          borderRadius: '12px',
          width: 'calc((100vw - 320px) / 3)',
          maxWidth: '600px',
          minWidth: '400px',
        },
        inner: {
          paddingRight: '320px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" className="task-form-header">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
                radius="xl"
                className="task-form-icon-button"
              >
                <IconPlus size={20} />
              </ActionIcon>
              <Box>
                <Text fw={700} size="xl" className="task-form-title">
                  {mode === 'create' ? 'יצירת משימה' : 'עריכת משימה'}
                </Text>
                <Text size="sm" c="dimmed" mt={4} className="task-form-description">
                  כאן {mode === 'create' ? 'תיצור' : 'תערוך'} את המשימה {mode === 'create' ? 'החדשה' : ''} שיופיע במערכת
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              size="lg"
              className="task-form-close-button"
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>

          <Stack gap="md">
            <TextInput
              label="שם המשימה"
              placeholder="צור שם למשימה"
              {...form.getInputProps('name')}
              className="task-form-field"
              classNames={{
                label: 'task-form-field-label',
                input: 'task-form-field-input',
              }}
            />

            <Group grow>
              <TextInput
                label="תאריך התחלה"
                type="date"
                value={form.values.startDate}
                onChange={(e) => form.setFieldValue('startDate', e.currentTarget.value)}
                className="task-form-field"
                classNames={{
                  label: 'task-form-field-label',
                  input: 'task-form-field-input',
                }}
              />
              <TextInput
                label="תאריך סיום"
                type="date"
                value={form.values.endDate}
                onChange={(e) => form.setFieldValue('endDate', e.currentTarget.value)}
                className="task-form-field"
                classNames={{
                  label: 'task-form-field-label',
                  input: 'task-form-field-input',
                }}
              />
            </Group>

            <Select
              label="פרויקט"
              placeholder="בחר פרויקט"
              data={projects.map((project) => ({ value: project.id, label: project.name }))}
              {...form.getInputProps('projectId')}
              searchable
              disabled={mode === 'edit'}
              className="task-form-field"
              classNames={{
                label: 'task-form-field-label',
                input: 'task-form-field-input',
              }}
            />

            <Textarea
              label="תאור המשימה"
              placeholder="תאר בקצרה את המשימה"
              autosize
              minRows={3}
              {...form.getInputProps('description')}
              className="task-form-field"
              classNames={{
                label: 'task-form-field-label',
                input: 'task-form-field-input',
              }}
            />
          </Stack>

          <Group justify="center" mt="md">
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconPlus size={18} />}
              size="md"
              fullWidth
              className="task-form-submit-button"
            >
              {mode === 'create' ? 'צור משימה' : 'שמור שינויים'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

