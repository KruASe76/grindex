import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {CreateObjectiveData} from '../../services/objectives';
import {
    createObjective,
    deleteObjective as apiDeleteObjective,
    getObjectives,
    updateObjective as apiUpdateObjective,
} from '../../services/objectives';


interface Objective {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

interface ObjectivesState {
    list: Objective[];
    loading: boolean;
    error: string | null;
}

const initialState: ObjectivesState = {
    list: [],
    loading: false,
    error: null,
};

export const fetchObjectives = createAsyncThunk(
    'objectives/fetch',
    (roomId: string) => getObjectives(roomId)
);

export const addObjective = createAsyncThunk(
    'objectives/add',
    ({roomId, objective}: { roomId: string; objective: CreateObjectiveData }) => createObjective(roomId, objective)
);

export const updateObjective = createAsyncThunk(
    'objectives/update',
    ({roomId, objectiveId, objective}: {
        roomId: string;
        objectiveId: string;
        objective: Partial<CreateObjectiveData>
    }) => apiUpdateObjective(roomId, objectiveId, objective)
);

export const deleteObjective = createAsyncThunk(
    'objectives/delete',
    ({roomId, objectiveId}: { roomId: string; objectiveId: string }) => apiDeleteObjective(roomId, objectiveId)
);

export const objectivesSlice = createSlice({
    name: 'objectives',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchObjectives.fulfilled, (state, action) => {
                state.list = action.payload;
            })
            .addCase(addObjective.fulfilled, (state, action) => {
                state.list.push(action.payload);
            })
            .addCase(updateObjective.fulfilled, (state, action) => {
                const index = state.list.findIndex(o => o.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(deleteObjective.fulfilled, (state, action) => {
                state.list = state.list.filter(o => o.id !== action.payload);
            });
    },
});

export type {Objective};
export default objectivesSlice.reducer;
