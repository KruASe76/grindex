import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getLeaderboard, getPersonalStats, getRoomStats} from '../../services/stats';


export interface PersonalStat {
    name: string;
    value: number;
    color: string;
    is_live?: boolean;
    start_time?: string;
}

export interface ParticipantStat {
    user_id: string;
    user_full_name: string;
    objectives: {
        objective_id: string;
        minutes: number;
        is_live?: boolean;
    }[];
    live_activities?: {
        objective_id: string;
        start_time: string;
    }[];
}

export interface LeaderboardEntry {
    objective_id: string;
    rankings: {
        user_id: string;
        user_full_name: string;
        minutes: number;
        is_live?: boolean;
        start_time?: string;
    }[];
}

interface StatsState {
    personalStats: PersonalStat[];
    participantStats: ParticipantStat[];
    leaderboard: LeaderboardEntry[];
    loading: boolean;
    error: string | null;
}

const initialState: StatsState = {
    personalStats: [],
    participantStats: [],
    leaderboard: [],
    loading: false,
    error: null,
};

export const fetchPersonalStats = createAsyncThunk('stats/fetchPersonal', getPersonalStats);

export const fetchStats = createAsyncThunk(
    'stats/fetch',
    (roomId: string) => getRoomStats(roomId)
);

export const fetchLeaderboard = createAsyncThunk(
    'stats/fetchLeaderboard',
    (roomId: string) => getLeaderboard(roomId)
);

export const statisticsSlice = createSlice({
    name: 'statistics',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPersonalStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPersonalStats.fulfilled, (state, action) => {
                state.loading = false;
                state.personalStats = action.payload;
            })
            .addCase(fetchStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchStats.fulfilled, (state, action) => {
                state.loading = false;
                state.participantStats = action.payload;
            })
            .addCase(fetchLeaderboard.fulfilled, (state, action) => {
                state.leaderboard = action.payload;
            });
    },
});

export default statisticsSlice.reducer;
