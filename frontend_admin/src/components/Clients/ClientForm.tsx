import { FC, useEffect } from 'react';
import { Button, Group, Modal, Stack, TextInput, Textarea, Text, ActionIcon, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconX, IconPlus } from '@tabler/icons-react';
import { Client } from '../../types/Client';
import '../../styles/components/ClientForm.css';

interface ClientFormProps {
  opened: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialClient?: Client | null;
  onSubmit: (values: { name: string; description?: string }) => void;
  submitting?: boolean;
}

export const ClientForm: FC<ClientFormProps> = ({
  opened,
  onClose,
  mode,
  initialClient,
  onSubmit,
  submitting = false,
}) => {
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'שם הוא שדה חובה' : null),
    },
  });

  useEffect(() => {
    if (mode === 'edit' && initialClient) {
      form.setValues({
        name: initialClient.name ?? '',
        description: initialClient.description ?? '',
      });
    } else {
      form.reset();
    }
  }, [mode, initialClient, opened]);

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values);
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="auto"
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
          {/* Header */}
          <Group justify="space-between" align="flex-start" className="client-form-header">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
                radius="xl"
                className="client-form-icon-button"
              >
                <IconPlus size={20} />
              </ActionIcon>
              <Box>
                <Text fw={700} size="xl" className="client-form-title">
                  {mode === 'create' ? 'יצירת לקוח' : 'עריכת לקוח'}
                </Text>
                {mode === 'create' && (
                  <Text size="sm" c="dimmed" mt={4} className="client-form-description">
                    כאן תיצור את הלקוח החדש שיופיע במערכת
                  </Text>
                )}
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              size="lg"
              className="client-form-close-button"
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>

          {/* Form Fields */}
          <Stack gap="md">
            <TextInput
              label="שם הלקוח"
              placeholder="מה שם הלקוח"
              {...form.getInputProps('name')}
              className="client-form-field"
              classNames={{
                label: 'client-form-field-label',
                input: 'client-form-field-input',
              }}
            />
            <Textarea
              label="תאור הלקוח"
              placeholder="תאר בקצרה את הלקוח"
              autosize
              minRows={3}
              {...form.getInputProps('description')}
              className="client-form-field"
              classNames={{
                label: 'client-form-field-label',
                input: 'client-form-field-input',
              }}
            />
          </Stack>

          {/* Submit Button */}
          <Group justify="center" mt="md">
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconPlus size={18} />}
              size="md"
              fullWidth
              className="client-form-submit-button"
            >
              {mode === 'create' ? 'צור לקוח חדש' : 'שמור שינויים'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

