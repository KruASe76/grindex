import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {MappingData} from '../../services/mappings';
import {
    deleteMapping as apiDeleteMapping,
    fetchMappings as apiFetchMappings,
    updateMapping
} from '../../services/mappings';


interface Mapping {
    activity_id: string;
    objective_id: string;
    weight: number;
}

interface MappingsState {
    list: Mapping[];
    loading: boolean;
    error: string | null;
}

const initialState: MappingsState = {
    list: [],
    loading: false,
    error: null,
};

export const fetchMappings = createAsyncThunk(
    'mappings/fetch',
    (roomId: string) => apiFetchMappings(roomId)
);

export const saveMapping = createAsyncThunk(
    'mappings/save',
    ({roomId, mapping}: { roomId: string; mapping: MappingData }) => updateMapping(roomId, mapping)
);

export const deleteMapping = createAsyncThunk(
    'mappings/delete',
    ({roomId, activityId, objectiveId}: {
        roomId: string;
        activityId: string;
        objectiveId: string
    }) => apiDeleteMapping(roomId, activityId, objectiveId)
);

export const activityMappingsSlice = createSlice({
    name: 'mappings',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMappings.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMappings.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(saveMapping.fulfilled, (state, action) => {
                const index = state.list.findIndex(
                    m => m.activity_id === action.payload.activity_id && m.objective_id === action.payload.objective_id
                );
                if (index >= 0) {
                    state.list[index] = action.payload;
                } else {
                    state.list.push(action.payload);
                }
            })
            .addCase(deleteMapping.fulfilled, (state, action) => {
                state.list = state.list.filter(
                    m => !(m.activity_id === action.payload.activityId && m.objective_id === action.payload.objectiveId)
                );
            });
    },
});

export default activityMappingsSlice.reducer;
