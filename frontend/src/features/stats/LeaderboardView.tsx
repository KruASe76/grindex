import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {fetchLeaderboard} from './statisticsSlice';
import styles from './LeaderboardView.module.scss';

interface LeaderboardViewProps {
    roomId: string;
}

interface RankingItem {
    user_id: string;
    user_full_name: string;
    minutes: number;
    isLive?: boolean;
}

export const LeaderboardView = ({roomId}: LeaderboardViewProps) => {
    const dispatch = useAppDispatch();
    const {leaderboard, loading} = useAppSelector((state) => state.statistics);
    const {list: objectives} = useAppSelector((state) => state.objectives);
    const liveRooms = useAppSelector((state) => state.liveStatus.rooms);

    // Trigger re-render every minute to update elapsed times
    const [, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        dispatch(fetchLeaderboard(roomId));
    }, [dispatch, roomId]);

    if (loading) return <div></div>;

    const getObjectiveName = (id: string) => objectives.find((o) => o.id === id)?.name || 'Unknown';
    const getObjectiveEmoji = (id: string) => objectives.find((o) => o.id === id)?.emoji || '❓';

    const getElapsedMinutes = (startTime: string) => {
        const start = new Date(startTime).getTime();
        return Math.max(0, Math.floor((new Date().getTime() - start) / 60000));
    };

    const aggregatedLeaderboard = leaderboard.reduce((acc, entry) => {
        const objectiveId = entry.objective_id;
        const objectiveName = getObjectiveName(objectiveId);
        const objectiveEmoji = getObjectiveEmoji(objectiveId);

        if (!acc[objectiveId]) {
            acc[objectiveId] = {
                objective_id: objectiveId,
                objective_name: objectiveName,
                objective_emoji: objectiveEmoji,
                rankings: {},
            };
        }

        entry.rankings.forEach((rank) => {
            if (!acc[objectiveId].rankings[rank.user_id]) {
                acc[objectiveId].rankings[rank.user_id] = {
                    user_id: rank.user_id,
                    user_full_name: rank.user_full_name,
                    minutes: 0,
                };
            }
            acc[objectiveId].rankings[rank.user_id].minutes += rank.minutes;
        });

        return acc;
    }, {} as {
        [key: string]: {
            objective_id: string;
            objective_name: string;
            objective_emoji: string;
            rankings: { [key: string]: { user_id: string; user_full_name: string; minutes: number } }
        }
    });

    const finalLeaderboard = Object.values(aggregatedLeaderboard).map((entry) => {
        const liveUsers = liveRooms[roomId] || {};

        const rankingsWithLiveTime: RankingItem[] = Object.values(entry.rankings).map(rank => {
            const liveObjective = liveUsers[rank.user_id]?.find(o => o.objectiveId === entry.objective_id);
            if (liveObjective) {
                return {
                    ...rank,
                    minutes: rank.minutes + getElapsedMinutes(liveObjective.startTime),
                    isLive: true,
                };
            }
            return rank;
        });

        const sortedRankings = rankingsWithLiveTime.sort((a, b) => b.minutes - a.minutes);

        return {
            objective_id: entry.objective_id,
            objective_name: entry.objective_name,
            objective_emoji: entry.objective_emoji,
            rankings: sortedRankings,
        };
    });

    return (
        <div className={styles.grid}>
            {finalLeaderboard.map((item) => (
                <div key={item.objective_id} className={styles.card}>
                    <div className={styles.header}>
                        <span className={styles.emoji}>{item.objective_emoji}</span>
                        <h4>{item.objective_name}</h4>
                    </div>
                    <ol className={styles.list}>
                        {item.rankings.map((rank, index: number) => {
                            const isLive = rank.isLive;
                            return (
                                <li key={rank.user_id} className={styles.item}>
                                    <span className={styles.rank}>{index + 1}.</span>
                                    <span className={styles.user}>{rank.user_full_name}</span>
                                    <span className={styles.score}>
                    {isLive && <span className={styles.liveDot} title="Live">●</span>}
                                        {(rank.minutes / 60).toFixed(1)}h
                </span>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            ))}
        </div>
    );
};
