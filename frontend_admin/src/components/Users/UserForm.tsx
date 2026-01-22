import { Modal, TextInput, PasswordInput, Select, Switch, Button, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { User, CreateUserInput, UpdateUserInput } from '../../types/User';

interface UserFormProps {
    opened: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    initialUser: User | null;
    onSubmit: (values: CreateUserInput | UpdateUserInput) => Promise<void>;
    submitting: boolean;
}

export function UserForm({ opened, onClose, mode, initialUser, onSubmit, submitting }: UserFormProps) {
    const form = useForm({
        initialValues: {
            name: '',
            mail: '',
            password: '',
            userType: 'worker' as 'admin' | 'worker',
            active: true,
        },
        validate: {
            name: (value) => (value.trim().length === 0 ? 'שם הוא שדה חובה' : null),
            mail: (value) => {
                if (value.trim().length === 0) return 'אימייל הוא שדה חובה';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'כתובת אימייל לא תקינה';
                return null;
            },
            password: (value) => {
                if (mode === 'create') {
                    if (value.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים';
                    if (!/(?=.*[a-z])/.test(value)) return 'הסיסמה חייבת להכיל לפחות אות קטנה אחת';
                    if (!/(?=.*[A-Z])/.test(value)) return 'הסיסמה חייבת להכיל לפחות אות גדולה אחת';
                    if (!/(?=.*[@$!%*?&])/.test(value)) return 'הסיסמה חייבת להכיל לפחות תו מיוחד אחד (@$!%*?&)';
                }
                return null;
            },
        },
    });

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (opened) {
            if (mode === 'edit' && initialUser) {
                form.setValues({
                    name: initialUser.name,
                    mail: initialUser.mail,
                    password: '', // Password not editable in edit mode
                    userType: initialUser.userType,
                    active: initialUser.active,
                });
            } else {
                form.reset();
            }
        }
    }, [opened, mode, initialUser]);

    const handleSubmit = async (values: typeof form.values) => {
        if (mode === 'create') {
            await onSubmit({
                name: values.name,
                mail: values.mail,
                password: values.password,
                userType: values.userType,
            });
        } else {
            await onSubmit({
                name: values.name,
                mail: values.mail,
                userType: values.userType,
                active: values.active,
            });
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={mode === 'create' ? 'צור משתמש חדש' : 'ערוך משתמש'}
            centered
            dir="rtl"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="שם"
                        placeholder="הזן שם מלא"
                        required
                        {...form.getInputProps('name')}
                    />

                    <TextInput
                        label="אימייל"
                        placeholder="example@company.com"
                        required
                        {...form.getInputProps('mail')}
                    />

                    {mode === 'create' && (
                        <PasswordInput
                            label="סיסמה"
                            placeholder="הזן סיסמה"
                            required
                            description="לפחות 8 תווים, אות גדולה, אות קטנה ותו מיוחד (@$!%*?&)"
                            {...form.getInputProps('password')}
                        />
                    )}

                    <Select
                        label="סוג משתמש"
                        placeholder="בחר סוג משתמש"
                        required
                        data={[
                            { value: 'worker', label: 'עובד' },
                            { value: 'admin', label: 'מנהל' },
                        ]}
                        {...form.getInputProps('userType')}
                    />

                    {mode === 'edit' && (
                        <Switch
                            label="משתמש פעיל"
                            {...form.getInputProps('active', { type: 'checkbox' })}
                        />
                    )}

                    <Button type="submit" loading={submitting} fullWidth>
                        {mode === 'create' ? 'צור משתמש' : 'עדכן משתמש'}
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
