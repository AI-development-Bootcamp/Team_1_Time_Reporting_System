import { FC, useEffect, useState } from 'react';
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
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconX, IconPlus } from '@tabler/icons-react';
import { useClients } from '../../hooks/useClients';
import { useProjects, Project } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import '../../styles/components/ProjectForm.css';
import { CreateProjectInput } from '../../types/Project';
import dayjs from 'dayjs';

interface ProjectFormProps {
  opened: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialProjectId?: string | null;
  onSubmit: (values: CreateProjectInput) => void;
  submitting?: boolean;
}

export const ProjectForm: FC<ProjectFormProps> = ({
  opened,
  onClose,
  mode = 'create',
  initialProjectId,
  onSubmit,
  submitting = false,
}) => {
  const { clientsQuery } = useClients();
  const { usersQuery } = useUsers();
  const [, setProject] = useState<Project | null>(null);
  const { projectsQuery } = useProjects();

  const form = useForm({
    initialValues: {
      name: '',
      clientId: '',
      projectManagerId: '',
      startDate: '',
      endDate: '',
      description: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'שם הפרויקט נדרש' : null),
      clientId: (value) => (value.length === 0 ? 'שם הלקוח נדרש' : null),
      projectManagerId: (value) => (value.length === 0 ? 'מנהל ראשי נדרש' : null),
      startDate: (value) => (value.length === 0 ? 'תאריך התחלה נדרש' : null),
    },
  });

  // Load project data for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialProjectId && opened && projectsQuery.data) {
      const foundProject = projectsQuery.data.find((p) => p.id === initialProjectId);
      if (foundProject) {
        setProject(foundProject);
        form.setValues({
          name: foundProject.name ?? '',
          clientId: String(foundProject.clientId ?? ''),
          projectManagerId: String(foundProject.projectManagerId ?? ''),
          startDate: foundProject.startDate
            ? dayjs(foundProject.startDate).format('YYYY-MM-DD')
            : '',
          endDate: foundProject.endDate
            ? dayjs(foundProject.endDate).format('YYYY-MM-DD')
            : '',
          description: foundProject.description ?? '',
        });
      }
    } else if (!opened) {
      form.reset();
      setProject(null);
    }
  }, [mode, initialProjectId, opened, projectsQuery.data]);

  const handleSubmit = form.onSubmit((values) => {
    onSubmit({
      name: values.name,
      clientId: values.clientId,
      projectManagerId: values.projectManagerId,
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      description: values.description || undefined,
    });
  });

  const clients = clientsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="lg"
      withCloseButton={false}
      classNames={{
        content: 'project-form-modal-content',
      }}
      styles={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start" className="project-form-header">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
                radius="xl"
                className="project-form-icon-button"
              >
                <IconPlus size={20} />
              </ActionIcon>
              <Box>
                <Text fw={700} size="xl" className="project-form-title">
                  {mode === 'create' ? 'יצירת פרוייקט' : 'עריכת פרוייקט'}
                </Text>
                <Text size="sm" c="dimmed" mt={4} className="project-form-description">
                  כאן {mode === 'create' ? 'תיצור' : 'תערוך'} את הפרויקט {mode === 'create' ? 'החדש' : ''} שיופיע במערכת
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              size="lg"
              className="project-form-close-button"
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>

          {/* Form Fields */}
          <Stack gap="md">
            <TextInput
              label="שם הפרוייקט"
              placeholder="צור שם לפרויקט"
              {...form.getInputProps('name')}
              className="project-form-field"
              classNames={{
                label: 'project-form-field-label',
                input: 'project-form-field-input',
              }}
            />

            <Select
              label="שם הלקוח"
              placeholder="מה שם הלקוח"
              data={clients.map((client) => ({ value: String(client.id), label: client.name }))}
              {...form.getInputProps('clientId')}
              searchable
              className="project-form-field"
              classNames={{
                label: 'project-form-field-label',
                input: 'project-form-field-input',
              }}
            />

            <Select
              label="שייך מנהל ראשי לפרויקט"
              placeholder="בחר מנהל"
              data={users.map((user) => ({ value: String(user.id), label: user.name }))}
              {...form.getInputProps('projectManagerId')}
              searchable
              disabled={usersQuery.isLoading}
              className="project-form-field"
              classNames={{
                label: 'project-form-field-label',
                input: 'project-form-field-input',
              }}
            />

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="תאריך התחלה"
                  type="date"
                  value={form.values.startDate}
                  onChange={(e) => form.setFieldValue('startDate', e.currentTarget.value)}
                  className="project-form-field"
                  classNames={{
                    label: 'project-form-field-label',
                    input: 'project-form-field-input',
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="תאריך סיום"
                  type="date"
                  value={form.values.endDate}
                  onChange={(e) => form.setFieldValue('endDate', e.currentTarget.value)}
                  className="project-form-field"
                  classNames={{
                    label: 'project-form-field-label',
                    input: 'project-form-field-input',
                  }}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="תאור הפרויקט"
              placeholder="תאר בקצרה את הפרויקט"
              autosize
              minRows={3}
              {...form.getInputProps('description')}
              className="project-form-field"
              classNames={{
                label: 'project-form-field-label',
                input: 'project-form-field-input',
              }}
            />
          </Stack>

          {/* Submit Button */}
          <Group justify="flex-end" mt="md">
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconPlus size={18} />}
              size="md"
              className="project-form-submit-button"
            >
              {mode === 'create' ? 'צור פרויקט' : 'שמור שינויים'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

