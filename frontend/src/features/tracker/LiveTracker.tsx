import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {fetchActiveTracker, stopActivityTracker} from './trackerSlice';
import {fetchActivities} from '../activity/activitySlice';
import styles from './LiveTracker.module.scss';

export const LiveTracker = () => {
    const dispatch = useAppDispatch();
    const {active} = useAppSelector((state) => state.tracker);
    const {list: activities} = useAppSelector((state) => state.activity);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        dispatch(fetchActiveTracker());
        // Ensure activities are loaded to show name
        if (activities.length === 0) {
            dispatch(fetchActivities());
        }
    }, [dispatch, activities.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!active) return null;

    const currentActivity = activities.find(a => a.id === active.activity_id);

    const startTime = new Date(active.start_time).getTime();
    const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.tracker}>
            <div className={styles.info}>
                <div className={styles.label}>Current Activity</div>
                <div className={styles.activity}>
                    <span className={styles.emoji}>{currentActivity?.emoji}</span>
                    <span>{currentActivity?.name || 'Loading...'}</span>
                </div>
            </div>
            <div className={styles.time}>
                {formatTime(elapsed)}
            </div>
            <button
                onClick={() => dispatch(stopActivityTracker())}
                className={styles.stopBtn}
            >
                Stop
            </button>
        </div>
    );
};
