/* eslint-disable @typescript-eslint/no-explicit-any */
import {configureStore} from '@reduxjs/toolkit';
import authReducer, {login, logout, register, setCredentials} from './authSlice';
import {loginUser, registerUser} from '../../services/auth';

vi.mock('../../services/auth', () => ({
    loginUser: vi.fn(),
    registerUser: vi.fn(),
}));

const mockedLoginUser = loginUser as any;
const mockedRegisterUser = registerUser as any;

describe('auth slice', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore({reducer: {auth: authReducer}});
        mockedLoginUser.mockClear();
        mockedRegisterUser.mockClear();
    });

    it('should handle initial state', () => {
        expect(store.getState().auth).toEqual({
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        });
    });

    it('should handle logout', () => {
        // set some state to be cleared
        store.dispatch(setCredentials({access_token: 'test-token', refresh_token: 'test-refresh'}));
        expect(store.getState().auth.isAuthenticated).toBe(true);

        store.dispatch(logout());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.token).toBeNull();
        expect(state.refreshToken).toBeNull();
    });

    it('should handle setCredentials', () => {
        const credentials = {access_token: 'new-token', refresh_token: 'new-refresh'};
        store.dispatch(setCredentials(credentials));
        const state = store.getState().auth;
        expect(state.token).toBe('new-token');
        expect(state.refreshToken).toBe('new-refresh');
        expect(state.isAuthenticated).toBe(true);
    });

    describe('login async thunk', () => {
        it('should handle fulfilled state', async () => {
            const response = {access_token: 'logged-in-token', refresh_token: 'logged-in-refresh'};
            mockedLoginUser.mockResolvedValue(response);

            await store.dispatch(login({email: 'test@example.com', password: 'password'}));

            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(true);
            expect(state.token).toBe(response.access_token);
            expect(state.refreshToken).toBe(response.refresh_token);
        });

        it('should handle pending state', () => {
            mockedLoginUser.mockReturnValue(new Promise(() => {}));
            store.dispatch(login({email: 'test@example.com', password: 'password'}));

            const state = store.getState().auth;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle rejected state', async () => {
            const error = {message: 'Invalid credentials'};
            mockedLoginUser.mockRejectedValue(error);

            await store.dispatch(login({email: 'test@example.com', password: 'password'}));

            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(false);
            expect(state.error).toBe('Invalid credentials');
        });
    });

    describe('register async thunk', () => {
        it('should handle fulfilled state', async () => {
            const response = {access_token: 'registered-token', refresh_token: 'registered-refresh'};
            mockedRegisterUser.mockResolvedValue(response);

            await store.dispatch(register({email: 'new@example.com', password: 'new', full_name: 'New User'}));

            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(true);
            expect(state.token).toBe(response.access_token);
            expect(state.refreshToken).toBe(response.refresh_token);
        });

        it('should handle pending state', () => {
            mockedRegisterUser.mockReturnValue(new Promise(() => {
            }));
            store.dispatch(register({email: 'new@example.com', password: 'new', full_name: 'New User'}));

            const state = store.getState().auth;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle rejected state', async () => {
            const error = {message: 'Email already exists'};
            mockedRegisterUser.mockRejectedValue(error);

            await store.dispatch(register({email: 'new@example.com', password: 'new', full_name: 'New User'}));

            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(false);
            expect(state.error).toBe('Email already exists');
        });
    });
});
