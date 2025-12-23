import {store} from '../app/store';
import {logout, setCredentials} from '@features/auth/authSlice';
import {Mutex} from 'async-mutex';
import {API_URL} from '../config';

const mutex = new Mutex();

export const baseQuery = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const token = store.getState().auth.token;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    } as Record<string, string>;

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    options.headers = headers;

    let response = await fetch(`${API_URL}${endpoint}`, options);

    if (response.status === 401) {
        console.debug(`[API] 401 Unauthorized for ${endpoint}. Checking for refresh token...`);

        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                const state = store.getState();
                const refreshToken = state.auth.refreshToken;

                if (refreshToken) {
                    console.debug('[API] Refresh token found, attempting to refresh session...');

                    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({refresh_token: refreshToken}),
                    });

                    if (refreshResponse.ok) {
                        const newTokens = await refreshResponse.json();
                        console.debug('[API] Session refreshed successfully.');

                        store.dispatch(setCredentials(newTokens));

                        // retry original request with new token
                        (options.headers as Record<string, string>)['Authorization'] = `Bearer ${newTokens.access_token}`;
                        response = await fetch(`${API_URL}${endpoint}`, options);
                    } else {
                        console.warn(`[API] Refresh failed with status ${refreshResponse.status}. Logging out.`);
                        store.dispatch(logout());
                        throw new Error('Session expired: Refresh failed');
                    }
                } else {
                    console.warn('[API] No refresh token available. Logging out.');
                    store.dispatch(logout());
                    throw new Error('Session expired: No refresh token');
                }
            } catch (error) {
                console.error('[API] Error during token refresh:', error);
                store.dispatch(logout());
                throw error;
            } finally {
                release();
            }
        } else {
            console.debug('[API] Mutex locked, waiting for token refresh...');
            await mutex.waitForUnlock();

            const newToken = store.getState().auth.token;
            if (newToken) {
                console.debug('[API] Mutex unlocked, retrying request with new token.');
                (options.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(`${API_URL}${endpoint}`, options);
            } else {
                console.warn('[API] Mutex unlocked but no valid token found.');
                throw new Error('Session expired: Token missing after refresh');
            }
        }
    }

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const api = {
    get: (endpoint: string, options: RequestInit = {}) => baseQuery(endpoint, {...options, method: 'GET'}),
    post: (endpoint: string, body: unknown, options: RequestInit = {}) => baseQuery(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
    }),
    put: (endpoint: string, body: unknown, options: RequestInit = {}) => baseQuery(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body)
    }),
    patch: (endpoint: string, body: unknown, options: RequestInit = {}) => baseQuery(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body)
    }),
    delete: (endpoint: string, options: RequestInit = {}) => baseQuery(endpoint, {...options, method: 'DELETE'}),
};

export default api;
