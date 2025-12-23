import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {fetchRooms} from './roomsSlice';
import {Crown} from 'lucide-react';
import styles from './RoomList.module.scss';
import {fetchUserProfile} from '@features/user/userProfileSlice';

export const RoomList = () => {
    const dispatch = useAppDispatch();
    const {list, loading} = useAppSelector((state) => state.rooms);
    const user = useAppSelector((state) => state.userProfile.profile);
    const liveRooms = useAppSelector((state) => state.liveStatus.rooms);

    useEffect(() => {
        dispatch(fetchUserProfile());
        dispatch(fetchRooms());
    }, [dispatch]);

    if (loading) return <div></div>;

    return (
        <div className={styles.list}>
            {list.map((room) => {
                const isLive = liveRooms[room.id] && Object.values(liveRooms[room.id]).some(objectives => objectives.length > 0);

                return (
                    <Link key={room.id} to={`/rooms/${room.id}`} className={styles.card}>
                        <div className={styles.name}>
                            {isLive && <span className={styles.liveDot} title="Live Activity">●</span>}
                            {room.name}
                            {user && room.admin_id === user.id && <Crown size={16} className={styles.adminIcon}/>}
                        </div>
                        <div className={styles.resolution}>{room.resolution}</div>
                    </Link>
                )
            })}
        </div>
    );
};
