import { useState, useEffect } from 'react';
import {
    Button,
    Group,
    Table,
    Text,
    Stack,
    Loader,
    Center,
    ActionIcon,
    TextInput,
    Badge,
} from '@mantine/core';
import { IconPencil, IconTrash, IconKey, IconSearch, IconPlus } from '@tabler/icons-react';
import { useUsers } from '../../hooks/useUsers';
import { User } from '../../types/User';
import { UserForm } from './UserForm';
import { ResetPasswordModal } from './ResetPasswordModal';
import { DeleteConfirmationModal } from '../Common/DeleteConfirmationModal';
import { ReusableTable } from '../Common/ReusableTable';
import { ReusablePagination } from '../Common/ReusablePagination';
import tableStyles from '../Common/ReusableTable.module.css';
import styles from '../../styles/components/UsersTable.module.css';

interface TableRowProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (userId: number) => void;
    onResetPassword: (userId: number) => void;
}

function TableRow({ user, onEdit, onDelete, onResetPassword }: TableRowProps) {
    return (
        <Table.Tr className={tableStyles.tableBodyRow}>
            <Table.Td className={tableStyles.tableCell}>
                <Text size="sm" className={tableStyles.tableText}>
                    {user.name}
                </Text>
            </Table.Td>
            <Table.Td className={tableStyles.tableCellWithBorder}>
                <Text size="sm" className={tableStyles.tableText}>
                    {user.mail}
                </Text>
            </Table.Td>
            <Table.Td className={tableStyles.tableCellWithBorder}>
                <Badge color={user.userType === 'admin' ? 'blue' : 'gray'} variant="light">
                    {user.userType === 'admin' ? 'מנהל' : 'עובד'}
                </Badge>
            </Table.Td>
            <Table.Td className={tableStyles.tableCellWithBorder}>
                <Badge color={user.active ? 'green' : 'red'} variant="light">
                    {user.active ? 'פעיל' : 'לא פעיל'}
                </Badge>
            </Table.Td>
            <Table.Td className={`${tableStyles.tableCellWithBorder} ${tableStyles.tableCellCentered}`}>
                <Group gap="xs" justify="center">
                    <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="lg"
                        onClick={() => onEdit(user)}
                        title="ערוך משתמש"
                    >
                        <IconPencil size={18} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        color="orange"
                        size="lg"
                        onClick={() => onResetPassword(user.id)}
                        title="אפס סיסמה"
                    >
                        <IconKey size={18} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        size="lg"
                        onClick={() => onDelete(user.id)}
                        title="מחק משתמש"
                    >
                        <IconTrash size={18} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}

export function UsersTable() {
    const { usersQuery, createUserMutation, updateUserMutation, deleteUserMutation, resetPasswordMutation } =
        useUsers();

    const [formOpened, setFormOpened] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activePage, setActivePage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete confirmation modal state
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [pendingDeleteUserId, setPendingDeleteUserId] = useState<number | null>(null);

    // Reset password modal state
    const [resetPasswordModalOpened, setResetPasswordModalOpened] = useState(false);
    const [pendingResetUserId, setPendingResetUserId] = useState<number | null>(null);

    const itemsPerPage = 10;

    const users = usersQuery.data ?? [];

    const openCreateUser = () => {
        setSelectedUser(null);
        setFormMode('create');
        setFormOpened(true);
    };

    const openEditUser = (user: User) => {
        setSelectedUser(user);
        setFormMode('edit');
        setFormOpened(true);
    };

    const openDeleteUser = (userId: number) => {
        setPendingDeleteUserId(userId);
        setDeleteModalOpened(true);
    };

    const openResetPassword = (userId: number) => {
        setPendingResetUserId(userId);
        setResetPasswordModalOpened(true);
    };

    const handleSubmit = async (values: any) => {
        if (formMode === 'create') {
            await createUserMutation.mutateAsync(values);
        } else if (formMode === 'edit' && selectedUser) {
            await updateUserMutation.mutateAsync({
                id: selectedUser.id,
                data: values,
            });
        }
        setFormOpened(false);
    };

    const handleDelete = async () => {
        if (pendingDeleteUserId) {
            await deleteUserMutation.mutateAsync(pendingDeleteUserId);
            setDeleteModalOpened(false);
            setPendingDeleteUserId(null);
        }
    };

    const handleResetPassword = async (newPassword: string) => {
        if (pendingResetUserId) {
            await resetPasswordMutation.mutateAsync({
                id: pendingResetUserId,
                data: { newPassword },
            });
            setResetPasswordModalOpened(false);
            setPendingResetUserId(null);
        }
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setActivePage(1);
    }, [searchQuery]);

    if (usersQuery.isLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (usersQuery.isError) {
        return (
            <Center h={200}>
                <Text c="red">Failed to load users.</Text>
            </Center>
        );
    }

    // Filter users by search query (name or email)
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.mail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (activePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return (
        <Stack gap={0} className={styles.usersTableContainer}>
            <Group justify="flex-end" gap="md" mb="md">
                <TextInput
                    placeholder="חיפוש לפי שם או אימייל"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    leftSection={<IconSearch size={16} />}
                    className={styles.searchInput}
                />
                <Button
                    leftSection={<IconPlus size={16} />}
                    className={styles.createButton}
                    onClick={openCreateUser}
                >
                    צור משתמש חדש
                </Button>
            </Group>

            <ReusableTable
                columns={[
                    { label: 'שם' },
                    { label: 'אימייל' },
                    { label: 'סוג משתמש' },
                    { label: 'סטטוס' },
                    { label: 'פעולות', align: 'center' },
                ]}
                isEmpty={filteredUsers.length === 0}
                emptyMessage="לא נמצאו משתמשים"
            >
                {paginatedUsers.map((user) => (
                    <TableRow
                        key={user.id}
                        user={user}
                        onEdit={openEditUser}
                        onDelete={openDeleteUser}
                        onResetPassword={openResetPassword}
                    />
                ))}
            </ReusableTable>

            {filteredUsers.length > 0 && (
                <ReusablePagination
                    currentPage={activePage}
                    totalPages={totalPages}
                    onPageChange={setActivePage}
                />
            )}

            <UserForm
                opened={formOpened}
                onClose={() => setFormOpened(false)}
                mode={formMode}
                initialUser={selectedUser}
                onSubmit={handleSubmit}
                submitting={createUserMutation.isPending || updateUserMutation.isPending}
            />

            <ResetPasswordModal
                opened={resetPasswordModalOpened}
                onClose={() => {
                    setResetPasswordModalOpened(false);
                    setPendingResetUserId(null);
                }}
                onSubmit={handleResetPassword}
                submitting={resetPasswordMutation.isPending}
            />

            {pendingDeleteUserId && (
                <DeleteConfirmationModal
                    opened={deleteModalOpened}
                    onClose={() => {
                        setDeleteModalOpened(false);
                        setPendingDeleteUserId(null);
                    }}
                    onConfirm={handleDelete}
                    title="מחיקת משתמש"
                    message="האם אתה בטוח שברצונך למחוק משתמש זה? המשתמש יסומן כלא פעיל."
                    confirming={deleteUserMutation.isPending}
                />
            )}
        </Stack>
    );
}
