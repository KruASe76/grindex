import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {changePassword as changePasswordService, getUserProfile, updateUserSettings} from '../../services/user';

export interface UserSettings {
    theme: 'light' | 'dark';
    updated_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    settings: UserSettings | null;
}

interface UserProfileState {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserProfileState = {
    profile: null,
    loading: false,
    error: null,
};

export const fetchUserProfile = createAsyncThunk('userProfile/fetch', getUserProfile);

export const updateSettings = createAsyncThunk(
    'userProfile/updateSettings',
    (settings: { theme: 'light' | 'dark' }) => updateUserSettings(settings)
);

export const changePassword = createAsyncThunk(
    'userProfile/changePassword',
    async (passwords: { old_password: string, new_password: string }, {rejectWithValue}) => {
        try {
            await changePasswordService(passwords);
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('An unknown error occurred');
        }
    }
);

export const userProfileSlice = createSlice({
    name: 'userProfile',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch profile';
            })
            .addCase(updateSettings.fulfilled, (state, action) => {
                if (state.profile) {
                    state.profile.settings = action.payload;
                }
            })
            .addCase(changePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default userProfileSlice.reducer;
