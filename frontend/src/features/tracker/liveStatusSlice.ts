import type {PayloadAction} from '@reduxjs/toolkit';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getLiveStatus} from '../../services/liveStatus';

interface LiveActivity {
    objectiveId: string;
    startTime: string;
}

interface LiveState {
    // Map<RoomId, Map<UserId, Array<LiveActivity>>>
    rooms: Record<string, Record<string, LiveActivity[]>>;
}

const initialState: LiveState = {
    rooms: {},
};

export const fetchLiveStatus = createAsyncThunk('liveStatus/fetch', getLiveStatus);

export const liveStatusSlice = createSlice({
    name: 'liveStatus',
    initialState,
    reducers: {
        updateLiveStatus: (state, action: PayloadAction<{
            roomId: string;
            userId: string;
            objectiveId: string;
            live: boolean;
            startTime?: string
        }>) => {
            const {roomId, userId, objectiveId, live, startTime} = action.payload;
            if (!state.rooms[roomId]) {
                state.rooms[roomId] = {};
            }
            if (!state.rooms[roomId][userId]) {
                state.rooms[roomId][userId] = [];
            }

            if (live && startTime) {
                if (!state.rooms[roomId][userId].some(a => a.objectiveId === objectiveId)) {
                    state.rooms[roomId][userId].push({objectiveId, startTime});
                }
            } else {
                state.rooms[roomId][userId] = state.rooms[roomId][userId].filter(a => a.objectiveId !== objectiveId);
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchLiveStatus.fulfilled, (state, action) => {
            state.rooms = action.payload;
        })
    }
});

export const {updateLiveStatus} = liveStatusSlice.actions;
export default liveStatusSlice.reducer;
