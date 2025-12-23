import {useEffect} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import type {Activity} from './activitySlice';
import {archiveActivity, fetchActivities, unarchiveActivity} from './activitySlice';
import {stopActivityTracker, switchActivityTracker} from '../tracker/trackerSlice';
import {Archive, Pencil, Play, Plus, RotateCcw, Square} from 'lucide-react';
import styles from './ActivityList.module.scss';
import {fetchPersonalStats} from '@features/stats/statisticsSlice';

interface ActivityListProps {
    onLogTime?: (activity: Activity) => void;
    onEdit?: (activity: Activity) => void;
    showArchived: boolean;
}

export const ActivityList = ({onLogTime, onEdit, showArchived}: ActivityListProps) => {
    const dispatch = useAppDispatch();
    const {list, loading} = useAppSelector((state) => state.activity);
    const {active} = useAppSelector((state) => state.tracker);

    useEffect(() => {
        dispatch(fetchActivities());
    }, [dispatch]);

    if (loading) return <div></div>;

    const displayedActivities = list.filter((a) => (showArchived ? true : !a.archived_at));

    return (
        <div className={styles.list}>
            {displayedActivities.map((activity) => {
                const isActive = active?.activity_id === activity.id;
                return (
                    <div key={activity.id} className={`${styles.card} ${isActive ? styles.active : ''}`}
                         style={{borderColor: activity.color, opacity: activity.archived_at ? 0.7 : 1}}
                         data-testid="activity-card"
                         data-activity-name={activity.name}>
                        <div className={styles.header}>
                            <span className={styles.emoji}>{activity.emoji}</span>
                            <span className={styles.name}>{activity.name}</span>
                            <span className={styles.resolution}>{activity.resolution}</span>
                        </div>
                        <div className={styles.details}>
                            {!activity.archived_at && (
                                isActive ? (
                                    <button
                                        onClick={() => {
                                            dispatch(stopActivityTracker());
                                            setTimeout(() => {
                                                dispatch(fetchPersonalStats());
                                            }, 100);
                                        }}
                                        className={styles.stopBtn}
                                        title="Stop Timer"
                                    >
                                        <Square size={16} fill="currentColor"/>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => dispatch(switchActivityTracker(activity.id))}
                                        className={styles.playBtn}
                                        title="Start Timer"
                                    >
                                        <Play size={16} fill="currentColor"/>
                                    </button>
                                )
                            )}
                            {!activity.archived_at && onLogTime && (
                                <button onClick={() => onLogTime(activity)} className={styles.logBtn} title="Log Time">
                                    <Plus size={16}/>
                                </button>
                            )}
                            {!activity.archived_at && onEdit && (
                                <button onClick={() => onEdit(activity)} className={styles.editBtn} title="Edit">
                                    <Pencil size={16}/>
                                </button>
                            )}
                            {activity.archived_at ? (
                                <button onClick={() => dispatch(unarchiveActivity(activity.id))}
                                        className={styles.unarchiveBtn} title="Unarchive">
                                    <RotateCcw size={16}/>
                                </button>
                            ) : (
                                <button onClick={() => dispatch(archiveActivity(activity.id))}
                                        className={styles.archiveBtn} title="Archive">
                                    <Archive size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};
