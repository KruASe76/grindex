import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {CreateActivityData} from '../../services/activity';
import {createActivity, getActivities, logTime, updateActivity} from '../../services/activity';

export interface Activity {
    id: string;
    name: string;
    emoji: string;
    color: string;
    resolution: string;
    archived_at: string | null;
}

interface ActivityState {
    list: Activity[];
    loading: boolean;
    error: string | null;
}

const initialState: ActivityState = {
    list: [],
    loading: false,
    error: null,
};

export const fetchActivities = createAsyncThunk('activity/fetch', getActivities);

export const addActivity = createAsyncThunk(
    'activity/add',
    (activity: CreateActivityData) => createActivity(activity)
);

export const logActivityTime = createAsyncThunk(
    'activity/logTime',
    ({activityId, date, duration}: {
        activityId: string;
        date: string;
        duration: number
    }) => logTime(activityId, date, duration)
);

export const archiveActivity = createAsyncThunk(
    'activity/archive',
    (id: string) => updateActivity(id, {is_archived: true})
);

export const unarchiveActivity = createAsyncThunk(
    'activity/unarchive',
    (id: string) => updateActivity(id, {is_archived: false})
);

export const editActivityDetails = createAsyncThunk(
    'activity/edit',
    ({id, updates}: { id: string; updates: Partial<CreateActivityData> }) => updateActivity(id, updates)
);

export const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchActivities.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchActivities.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(addActivity.fulfilled, (state, action) => {
                state.list.push(action.payload);
            })
            .addCase(archiveActivity.fulfilled, (state, action) => {
                const index = state.list.findIndex((a) => a.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(unarchiveActivity.fulfilled, (state, action) => {
                const index = state.list.findIndex((a) => a.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(editActivityDetails.fulfilled, (state, action) => {
                const index = state.list.findIndex((a) => a.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            });
    },
});

export default activitySlice.reducer;
