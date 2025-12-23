import {useCallback, useEffect, useMemo, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../app/hooks';
import {ActivityList} from '@features/activity/ActivityList';
import {CreateActivityForm} from '@features/activity/CreateActivityForm';
import {LogTimeModal} from '@features/activity/LogTimeModal';
import {EditActivityModal} from '@features/activity/EditActivityModal';
import type {Activity} from '@features/activity/activitySlice';
import {fetchActivities, logActivityTime} from '@features/activity/activitySlice';
import {fetchPersonalStats} from '@features/stats/statisticsSlice';
import {PersonalStatsChart} from '@features/stats/PersonalStatsChart';
import styles from './DashboardPage.module.scss';

export const DashboardPage = () => {
    const dispatch = useAppDispatch();
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const {personalStats} = useAppSelector((state) => state.statistics);
    const {list: activities} = useAppSelector((state) => state.activity);
    const {active} = useAppSelector((state) => state.tracker);

    // Trigger re-render every minute to update elapsed times in charts
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        dispatch(fetchPersonalStats());
        dispatch(fetchActivities());
    }, [dispatch]);

    const handleLogTime = (activity: Activity) => {
        setSelectedActivity(activity);
    };

    const handleEditActivity = (activity: Activity) => {
        setEditingActivity(activity);
    };

    const handleSaveLog = async (date: string, duration: number) => {
        if (selectedActivity) {
            await dispatch(logActivityTime({activityId: selectedActivity.id, date, duration}));
            dispatch(fetchPersonalStats()); // Refresh stats after logging
            setSelectedActivity(null);
        }
    };

    const getElapsedMinutes = useCallback((startTime: string) => {
        const start = new Date(startTime).getTime();
        return Math.max(0, Math.floor((now - start) / 60000));
    }, [now]);

    const filteredStats = useMemo(() => {
        let stats = personalStats;
        if (!showArchived) {
            const activeActivityNames = activities
                .filter((a) => !a.archived_at)
                .map((a) => a.name);
            stats = personalStats.filter((stat) => activeActivityNames.includes(stat.name));
        }

        // Add live time
        if (active) {
            const currentActivity = activities.find(a => a.id === active.activity_id);
            if (currentActivity) {
                const liveMinutes = getElapsedMinutes(active.start_time);
                return stats.map(s => {
                    if (s.name === currentActivity.name) {
                        return {...s, value: s.value + liveMinutes, isLive: true};
                    }
                    return s;
                });
            }
        }

        return stats;
    }, [personalStats, activities, showArchived, active, getElapsedMinutes]);

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>Dashboard</h1>
            </div>
            <div className={styles.content}>
                <div className={styles.mainColumn}>
                    <section>
                        <div className={styles.sectionHeader}>
                            <h2>My Activities</h2>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)}
                                />
                                Show Archived
                            </label>
                        </div>
                        <ActivityList onLogTime={handleLogTime} onEdit={handleEditActivity}
                                      showArchived={showArchived}/>
                    </section>
                    <section>
                        <h2>Statistics</h2>
                        <PersonalStatsChart data={filteredStats}/>
                    </section>
                </div>
                <div className={styles.sideColumn}>
                    <CreateActivityForm/>
                </div>
            </div>
            {selectedActivity && (
                <LogTimeModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onSave={handleSaveLog}
                />
            )}
            {editingActivity && (
                <EditActivityModal
                    activity={editingActivity}
                    onClose={() => setEditingActivity(null)}
                />
            )}
        </div>
    );
};
