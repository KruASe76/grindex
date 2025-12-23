import {baseQuery} from './api';

export const getUserProfile = () => baseQuery('/users/me');

export interface UpdateSettingsData {
    theme: 'light' | 'dark';
}

export const updateUserSettings = (settings: UpdateSettingsData) =>
    baseQuery('/users/me/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
    });

export const changePassword = (passwords: { old_password: string, new_password: string }) =>
    baseQuery('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(passwords),
    });
