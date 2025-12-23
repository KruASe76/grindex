import {baseQuery} from './api';

export const getRoomStats = (roomId: string) =>
    baseQuery(`/rooms/${roomId}/stats`);

export const getLeaderboard = (roomId: string) =>
    baseQuery(`/rooms/${roomId}/leaderboard`);

export const getPersonalStats = () =>
    baseQuery('/users/me/stats');
