import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {deleteMapping, fetchMappings, saveMapping} from './activityMappingsSlice';
import styles from './MappingModal.module.scss';
import {Plus, Trash2, X} from 'lucide-react';

interface MappingModalProps {
    roomId: string;
    onClose: () => void;
}

export const MappingModal = ({roomId, onClose}: MappingModalProps) => {
    const dispatch = useAppDispatch();
    const {list: activities} = useAppSelector((state) => state.activity);
    const {list: objectives} = useAppSelector((state) => state.objectives);
    const {list: mappings} = useAppSelector((state) => state.activityMappings);

    const [selectedActivity, setSelectedActivity] = useState('');
    const [selectedObjective, setSelectedObjective] = useState('');

    useEffect(() => {
        dispatch(fetchMappings(roomId));
    }, [dispatch, roomId]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleSave = () => {
        if (selectedActivity && selectedObjective) {
            dispatch(saveMapping({
                roomId,
                mapping: {
                    activity_id: selectedActivity,
                    objective_id: selectedObjective,
                }
            }));
            setSelectedActivity('');
            setSelectedObjective('');
        }
    };

    const handleDelete = (activityId: string, objectiveId: string) => {
        if (confirm('Are you sure you want to delete this mapping?')) {
            dispatch(deleteMapping({roomId, activityId, objectiveId}));
        }
    };

    const getActivityName = (id: string) => activities.find(a => a.id === id)?.name || 'Unknown Activity';
    const getObjectiveName = (id: string) => objectives.find(o => o.id === id)?.name || 'Unknown Objective';

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Manage Mappings</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20}/>
                    </button>
                </div>

                <div className={styles.existingMappings}>
                    <h4>Current Mappings</h4>
                    {mappings.length === 0 ? (
                        <p className={styles.empty}>No mappings found.</p>
                    ) : (
                        <ul className={styles.mappingList}>
                            {mappings.map((mapping) => (
                                <li key={`${mapping.activity_id}-${mapping.objective_id}`}
                                    className={styles.mappingItem}>
                  <span className={styles.mappingText}>
                    <strong>{getActivityName(mapping.activity_id)}</strong>
                    <span className={styles.arrow}>→</span>
                    <span>{getObjectiveName(mapping.objective_id)}</span>
                  </span>
                                    <button
                                        onClick={() => handleDelete(mapping.activity_id, mapping.objective_id)}
                                        className={styles.deleteBtn}
                                        title="Delete Mapping"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles.addSection}>
                    <h4>Add New Mapping</h4>
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label>My Activity</label>
                            <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
                                <option value="">Select Activity</option>
                                {activities.map((act) => (
                                    <option key={act.id} value={act.id}>{act.emoji} {act.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>Room Objective</label>
                            <select value={selectedObjective} onChange={(e) => setSelectedObjective(e.target.value)}>
                                <option value="">Select Objective</option>
                                {objectives.map((obj) => (
                                    <option key={obj.id} value={obj.id}>{obj.emoji} {obj.name}</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleSave} className={styles.saveBtn}
                                disabled={!selectedActivity || !selectedObjective}>
                            <Plus size={16}/> Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
