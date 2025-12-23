import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import type {CreateRoomData} from '../../services/rooms';
import {
    createRoom,
    getRooms,
    joinRoom as apiJoinRoom,
    kickMember as apiKickMember,
    leaveRoom as apiLeaveRoom
} from '../../services/rooms';


interface Room {
    id: string;
    name: string;
    resolution: string;
    admin_id: string;
}

interface RoomsState {
    list: Room[];
    currentRoom: Room | null;
    loading: boolean;
    error: string | null;
}

const initialState: RoomsState = {
    list: [],
    currentRoom: null,
    loading: false,
    error: null,
};

export const fetchRooms = createAsyncThunk('rooms/fetch', getRooms);

export const addRoom = createAsyncThunk(
    'rooms/add',
    (room: CreateRoomData) => createRoom(room)
);

export const leaveRoom = createAsyncThunk(
    'rooms/leave',
    (roomId: string) => apiLeaveRoom(roomId)
);

export const joinRoom = createAsyncThunk(
    'rooms/join',
    (roomId: string) => apiJoinRoom(roomId)
);

export const kickMember = createAsyncThunk(
    'rooms/kick',
    ({roomId, userId}: { roomId: string; userId: string }) => apiKickMember(roomId, userId)
);

export const roomsSlice = createSlice({
    name: 'rooms',
    initialState,
    reducers: {
        setCurrentRoom: (state, action) => {
            state.currentRoom = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRooms.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRooms.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(addRoom.fulfilled, (state, action) => {
                state.list.push(action.payload);
            })
            .addCase(leaveRoom.fulfilled, (state, action) => {
                state.list = state.list.filter(r => r.id !== action.payload);
            });
    },
});

export const {setCurrentRoom} = roomsSlice.actions;
export type {Room};
export default roomsSlice.reducer;
