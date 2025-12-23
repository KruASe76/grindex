import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {fetchStats} from './statisticsSlice';
import {PersonalStatsChart} from './PersonalStatsChart';
import {Crown} from 'lucide-react';
import styles from './ParticipantStatsView.module.scss';

interface ParticipantStatsViewProps {
    roomId: string;
}

export const ParticipantStatsView = ({roomId}: ParticipantStatsViewProps) => {
    const dispatch = useAppDispatch();
    const {participantStats, loading} = useAppSelector((state) => state.statistics);
    const {list: objectives} = useAppSelector((state) => state.objectives);
    const {list: rooms} = useAppSelector((state) => state.rooms);
    const liveRooms = useAppSelector((state) => state.liveStatus.rooms);

    const room = rooms.find(r => r.id === roomId);

    useEffect(() => {
        dispatch(fetchStats(roomId));
    }, [dispatch, roomId]);

    const [, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div></div>;

    const getObjectiveColor = (id: string) => objectives.find((o) => o.id === id)?.color || '#ccc';
    const getObjectiveName = (id: string) => objectives.find((o) => o.id === id)?.name || 'Unknown';

    // Calculate elapsed minutes for a given start time
    const getElapsedMinutes = (startTime: string) => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        return Math.max(0, Math.floor((now - start) / 60000));
    };

    return (
        <div className={styles.grid}>
            {participantStats.map((stat) => {
                const liveObjectives = liveRooms[roomId]?.[stat.user_id] || [];
                const isUserLive = liveObjectives.length > 0;

                const aggregatedData = stat.objectives.reduce((acc, obj) => {
                    const objectiveId = obj.objective_id;
                    if (!acc[objectiveId]) {
                        acc[objectiveId] = {
                            objectiveId: objectiveId,
                            name: getObjectiveName(objectiveId),
                            value: 0,
                            color: getObjectiveColor(objectiveId),
                            isLive: false,
                        };
                    }
                    acc[objectiveId].value += obj.minutes;

                    // Check if live
                    const liveActivity = liveObjectives.find(a => a.objectiveId === objectiveId);
                    if (liveActivity) {
                        acc[objectiveId].isLive = true;
                        acc[objectiveId].value += getElapsedMinutes(liveActivity.startTime);
                    }

                    return acc;
                }, {} as Record<string, {
                    objectiveId: string;
                    name: string;
                    value: number;
                    color: string;
                    isLive: boolean
                }>);

                const chartData = Object.values(aggregatedData);

                return (
                    <div key={stat.user_id} className={styles.card}>
                        <h4 className={styles.userName}>
                            {isUserLive && <span className={styles.liveDot} title="Live">●</span>}
                            {stat.user_full_name}
                            {room && room.admin_id === stat.user_id &&
                              <Crown size={16} className={styles.adminIcon} aria-label="Room Admin"/>}
                        </h4>
                        <PersonalStatsChart data={chartData}/>
                    </div>
                );
            })}
        </div>
    );
};
