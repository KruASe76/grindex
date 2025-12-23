import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {LoginCredentials, RegisterData} from '../../services/auth';
import {loginUser, registerUser} from '../../services/auth';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

export const login = createAsyncThunk('auth/login', async (credentials: LoginCredentials) => {
    const response = await loginUser(credentials);
    return response;
});

export const register = createAsyncThunk('auth/register', async (userData: RegisterData) => {
    const response = await registerUser(userData);
    return response;
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
        setCredentials: (
            state,
            action: { payload: { access_token: string; refresh_token: string } }
        ) => {
            state.token = action.payload.access_token;
            state.refreshToken = action.payload.refresh_token;
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.access_token;
                state.refreshToken = action.payload.refresh_token;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Login failed';
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.access_token;
                state.refreshToken = action.payload.refresh_token;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Registration failed';
            });
    },
});

export const {logout, setCredentials} = authSlice.actions;
export default authSlice.reducer;
