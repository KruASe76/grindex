import {useEffect} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {connectSocket, disconnectSocket, joinRoom} from '../../services/socket';
import {updateLiveStatus} from './liveStatusSlice';
import {fetchActiveTracker} from './trackerSlice';
import {fetchLeaderboard, fetchPersonalStats, fetchStats} from '../stats/statisticsSlice';

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

interface LiveStatusUpdate {
    userId: string;
    roomId: string;
    objectiveId: string;
    live: boolean;
    startTime?: string;
}

export const useSocketConnection = () => {
    const dispatch = useAppDispatch();
    const {token} = useAppSelector((state) => state.auth);
    const {list: rooms} = useAppSelector((state) => state.rooms);

    useEffect(() => {
        if (!token) {
            disconnectSocket();
            return;
        }

        const socket = connectSocket(token);
        const decoded = parseJwt(token);
        const userId = decoded?.sub;

        const onConnect = () => {
            console.log('Socket connected, joining rooms:', rooms.map(r => r.id));
            rooms.forEach(room => joinRoom(room.id));
        };

        const onLiveStatusUpdate = (data: LiveStatusUpdate) => {
            console.log('Live status update received:', data);
            // if the update is for current user, refresh my tracker state
            if (userId && data.userId === userId) {
                dispatch(fetchActiveTracker());
            }

            // if the update is for a room, update live status
            if (data.roomId) {
                dispatch(updateLiveStatus(data));

                // if the activity has stopped, refresh stats to get the newly logged time
                if (!data.live) {
                    dispatch(fetchPersonalStats());
                    dispatch(fetchStats(data.roomId));
                    dispatch(fetchLeaderboard(data.roomId));
                }
            }
        };

        socket.on('connect', onConnect);
        socket.on('live_status_update', onLiveStatusUpdate);

        // if already connected, join rooms immediately
        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('live_status_update', onLiveStatusUpdate);
        };
    }, [token, dispatch, rooms]);
};
