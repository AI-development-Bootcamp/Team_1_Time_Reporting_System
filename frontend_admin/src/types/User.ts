export interface User {
    id: number;
    name: string;
    mail: string;
    userType: 'admin' | 'worker';
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export type UserType = 'admin' | 'worker';

export interface CreateUserInput {
    name: string;
    mail: string;
    password: string;
    userType: UserType;
}

export interface UpdateUserInput {
    name?: string;
    mail?: string;
    userType?: UserType;
    active?: boolean;
}

export interface ResetPasswordInput {
    newPassword: string;
}
