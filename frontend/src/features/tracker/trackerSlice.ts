import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {ActiveActivity} from '../../services/tracker';
import {getActiveTracker, startTracker, stopTracker, switchTracker} from '../../services/tracker';

interface TrackerState {
    active: ActiveActivity | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: TrackerState = {
    active: null,
    status: 'idle',
};

export const fetchActiveTracker = createAsyncThunk('tracker/fetch', async () => {
    try {
        return await getActiveTracker();
    } catch (err: unknown) {
        const e = err as { response?: { status: number } };
        if (e.response && e.response.status === 404) {
            return null;
        }
        throw err;
    }
});

export const startActivityTracker = createAsyncThunk('tracker/start', async (activityId: string) => {
    return await startTracker(activityId);
});

export const stopActivityTracker = createAsyncThunk('tracker/stop', async () => {
    await stopTracker();
});

export const switchActivityTracker = createAsyncThunk('tracker/switch', async (activityId: string) => {
    return await switchTracker(activityId);
});

export const trackerSlice = createSlice({
    name: 'tracker',
    initialState,
    reducers: {
        clearTracker: (state) => {
            state.active = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchActiveTracker.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchActiveTracker.fulfilled, (state, action) => {
                state.status = 'idle';
                state.active = action.payload;
            })
            .addCase(fetchActiveTracker.rejected, (state) => {
                state.status = 'failed';
                state.active = null;
            })
            .addCase(startActivityTracker.fulfilled, (state, action) => {
                state.active = action.payload;
            })
            .addCase(stopActivityTracker.pending, (state) => {
                state.active = null;
            })
            .addCase(stopActivityTracker.fulfilled, (state) => {
                state.active = null;
            })
            .addCase(switchActivityTracker.fulfilled, (state, action) => {
                state.active = action.payload;
            });
    },
});

export const {clearTracker} = trackerSlice.actions;
export default trackerSlice.reducer;
