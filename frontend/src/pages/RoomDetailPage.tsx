import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../app/hooks';
import {fetchObjectives} from '@features/objectives/objectivesSlice';
import type {Room} from '@features/rooms/roomsSlice';
import {fetchRooms, joinRoom, leaveRoom} from '@features/rooms/roomsSlice';
import {RoomAdminPanel} from '@features/rooms/RoomAdminPanel';
import {ParticipantStatsView} from '@features/stats/ParticipantStatsView';
import {LeaderboardView} from '@features/stats/LeaderboardView';
import {MappingModal} from '@features/mappings/MappingModal';
import {fetchActivities} from '@features/activity/activitySlice';
import {ChevronLeft, Crown, LogOut} from 'lucide-react';
import styles from './RoomDetailPage.module.scss';
import {fetchUserProfile} from '@features/user/userProfileSlice';

export const RoomDetailPage = () => {
    const {roomId} = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {list: rooms, loading} = useAppSelector((state) => state.rooms);
    const user = useAppSelector((state) => state.userProfile.profile);

    const [viewMode, setViewMode] = useState<'participants' | 'leaderboard'>('participants');
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [joinAttempted, setJoinAttempted] = useState(false);

    const room = rooms.find((r) => r.id === roomId);
    const isAdmin = room?.admin_id === user?.id;

    useEffect(() => {
        if (roomId) {
            if (room) {
                // Room exists in state, fetch details
                dispatch(fetchObjectives(roomId));
                dispatch(fetchUserProfile());
                dispatch(fetchActivities());
            } else if (!loading && !joinAttempted) {
                // Room not found in state, try to fetch rooms first
                dispatch(fetchRooms()).then((action) => {
                    // If fetch rooms didn't find it, try joining
                    const roomsList = action.payload as Room[]; // Type assertion for payload
                    if (!roomsList || !roomsList.find(r => r.id === roomId)) {
                        setJoinAttempted(true);
                        dispatch(joinRoom(roomId)).then((joinAction) => {
                            if (joinAction.meta.requestStatus === 'fulfilled') {
                                // Join successful, refresh room list
                                dispatch(fetchRooms());
                            }
                        });
                    }
                });
            }
        }
    }, [dispatch, room, roomId, loading, joinAttempted]);

    const handleLeaveRoom = () => {
        if (room && confirm('Are you sure you want to leave this room?')) {
            dispatch(leaveRoom(room.id)).then(() => {
                navigate('/rooms');
            });
        }
    };

    if (loading && !room) return <div className={styles.loading}>Loading room details...</div>;
    if (!room) return <div>Room not found</div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <button className={styles.backButton} onClick={() => navigate('/rooms')}>
                        <ChevronLeft size={24}/>
                    </button>
                    <h1>
                        {room.name}
                        {isAdmin && <Crown size={24} className={styles.adminIcon} aria-label="Room Admin"/>}
                    </h1>
                    <span className={styles.resolution}>{room.resolution}</span>
                </div>
                <div className={styles.actions}>
                    {!isAdmin && (
                        <button onClick={handleLeaveRoom} className={styles.dangerBtn}>
                            <LogOut size={16}/> Leave Room
                        </button>
                    )}
                    <button onClick={() => setShowMappingModal(true)}>Map Activities</button>
                    <div className={styles.toggles}>
                        <button
                            className={viewMode === 'participants' ? styles.active : ''}
                            onClick={() => setViewMode('participants')}
                        >
                            Participants
                        </button>
                        <button
                            className={viewMode === 'leaderboard' ? styles.active : ''}
                            onClick={() => setViewMode('leaderboard')}
                        >
                            Leaderboard
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.main}>
                    {viewMode === 'participants' ? (
                        <ParticipantStatsView roomId={room.id}/>
                    ) : (
                        <LeaderboardView roomId={room.id}/>
                    )}
                </div>

                {isAdmin && (
                    <div className={styles.adminSection}>
                        <RoomAdminPanel roomId={room.id}/>
                    </div>
                )}
            </div>

            {showMappingModal && (
                <MappingModal roomId={room.id} onClose={() => setShowMappingModal(false)}/>
            )}
        </div>
    );
};
