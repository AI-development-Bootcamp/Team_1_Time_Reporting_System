import { Modal, PasswordInput, Button, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';

interface ResetPasswordModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (newPassword: string) => Promise<void>;
    submitting: boolean;
}

export function ResetPasswordModal({ opened, onClose, onSubmit, submitting }: ResetPasswordModalProps) {
    const form = useForm({
        initialValues: {
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            newPassword: (value) => {
                if (value.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים';
                if (!/(?=.*[a-z])/.test(value)) return 'הסיסמה חייבת להכיל לפחות אות קטנה אחת';
                if (!/(?=.*[A-Z])/.test(value)) return 'הסיסמה חייבת להכיל לפחות אות גדולה אחת';
                if (!/(?=.*[@$!%*?&])/.test(value)) return 'הסיסמה חייבת להכיל לפחות תו מיוחד אחד (@$!%*?&)';
                return null;
            },
            confirmPassword: (value, values) =>
                value !== values.newPassword ? 'הסיסמאות אינן תואמות' : null,
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        await onSubmit(values.newPassword);
        form.reset();
    };

    return (
        <Modal
            opened={opened}
            onClose={() => {
                form.reset();
                onClose();
            }}
            title="איפוס סיסמה"
            centered
            dir="rtl"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        הזן סיסמה חדשה למשתמש. הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ותו מיוחד.
                    </Text>

                    <PasswordInput
                        label="סיסמה חדשה"
                        placeholder="הזן סיסמה חדשה"
                        required
                        description="לפחות 8 תווים, אות גדולה, אות קטנה ותו מיוחד (@$!%*?&)"
                        {...form.getInputProps('newPassword')}
                    />

                    <PasswordInput
                        label="אימות סיסמה"
                        placeholder="הזן סיסמה שוב"
                        required
                        {...form.getInputProps('confirmPassword')}
                    />

                    <Button type="submit" loading={submitting} fullWidth>
                        אפס סיסמה
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
