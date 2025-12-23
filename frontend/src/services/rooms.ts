import {baseQuery} from './api';

export const getRooms = () => baseQuery('/rooms');

export interface CreateRoomData {
    name: string;
    resolution: string;
}

export const createRoom = (room: CreateRoomData) =>
    baseQuery('/rooms', {
        method: 'POST',
        body: JSON.stringify(room),
    });

export const leaveRoom = (roomId: string) =>
    baseQuery(`/rooms/${roomId}/join`, {
        method: 'DELETE',
    });

export const kickMember = (roomId: string, userId: string) =>
    baseQuery(`/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
    });

export const joinRoom = (roomId: string) =>
    baseQuery(`/rooms/${roomId}/join`, {
        method: 'POST',
    });
