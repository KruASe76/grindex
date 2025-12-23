import {io, Socket} from 'socket.io-client';
import {WS_URL} from '../config';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
    if (socket && socket.connected) return socket;
    if (socket) {
        socket.connect(); // reconnect if disconnected but the instance exists
        return socket;
    }

    socket = io(WS_URL, {
        auth: {
            token,
        },
        transports: ['websocket'],
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinRoom = (roomId: string) => {
    socket?.emit('join_room', roomId);
};

export const leaveRoom = (roomId: string) => {
    socket?.emit('leave_room', roomId);
};
