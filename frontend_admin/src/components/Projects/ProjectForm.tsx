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
import dayjs from 'dayjs';
import '../../styles/components/ProjectForm.css';
import { apiClient } from '@shared/utils/ApiClient';

export interface CreateProjectInput {
  name: string;
  clientId: string;
  projectManagerId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description?: string;
}

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
  // TODO: Add useUsers hook when backend endpoint is available
  const [project, setProject] = useState<Project | null>(null);

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
    if (mode === 'edit' && initialProjectId && opened) {
      apiClient.get(`/admin/projects`).then((res) => {
        const projects = res.data as Project[];
        const foundProject = projects.find((p) => p.id === initialProjectId);
        if (foundProject) {
          setProject(foundProject);
          form.setValues({
            name: foundProject.name ?? '',
            clientId: foundProject.clientId ?? '',
            projectManagerId: foundProject.projectManagerId ?? '',
            startDate: foundProject.startDate ?? '',
            endDate: foundProject.endDate ?? '',
            description: foundProject.description ?? '',
          });
        }
      });
    } else if (!opened) {
      form.reset();
      setProject(null);
    }
  }, [mode, initialProjectId, opened]);

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
  const users: Array<{ id: string; name: string }> = []; // TODO: Replace with useUsers when endpoint is available

  // Format date for display (DD/MM/YYYY) from YYYY-MM-DD
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = dayjs(dateStr, 'YYYY-MM-DD');
    return date.isValid() ? date.format('DD/MM/YYYY') : '';
  };

  // Parse date from display format (DD/MM/YYYY) to YYYY-MM-DD
  const parseDateFromDisplay = (displayDate: string) => {
    if (!displayDate || displayDate.trim() === '') return '';
    const parts = displayDate.split('/').filter((p) => p.trim() !== '');
    if (parts.length === 3) {
      const [day, month, year] = parts.map((p) => p.trim());
      const date = dayjs(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 'YYYY-MM-DD');
      return date.isValid() ? date.format('YYYY-MM-DD') : '';
    }
    return '';
  };

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
              data={clients.map((client) => ({ value: client.id, label: client.name }))}
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
              data={users.map((user) => ({ value: user.id, label: user.name }))}
              {...form.getInputProps('projectManagerId')}
              searchable
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
                  placeholder="DD/MM/YYYY"
                  value={formatDateForDisplay(form.values.startDate)}
                  onChange={(e) => {
                    const parsed = parseDateFromDisplay(e.currentTarget.value);
                    form.setFieldValue('startDate', parsed);
                  }}
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
                  placeholder="DD/MM/YYYY"
                  value={formatDateForDisplay(form.values.endDate)}
                  onChange={(e) => {
                    const parsed = parseDateFromDisplay(e.currentTarget.value);
                    form.setFieldValue('endDate', parsed);
                  }}
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

