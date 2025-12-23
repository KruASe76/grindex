import {useEffect, useState} from 'react';
import {useAppDispatch} from '../../app/hooks';
import type {Activity} from './activitySlice';
import {editActivityDetails} from './activitySlice';
import styles from './LogTimeModal.module.scss'; // Reusing modal styles
import {X} from 'lucide-react';

interface EditActivityModalProps {
    activity: Activity;
    onClose: () => void;
}

export const EditActivityModal = ({activity, onClose}: EditActivityModalProps) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(activity.name);
    const [emoji, setEmoji] = useState(activity.emoji);
    const [color, setColor] = useState(activity.color);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(editActivityDetails({id: activity.id, updates: {name, emoji, color}}));
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={20}/>
                </button>
                <h3>Edit Activity</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label>Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required/>
                    </div>
                    <div className={styles.field}>
                        <label>Emoji</label>
                        <input value={emoji} onChange={(e) => setEmoji(e.target.value)}/>
                    </div>
                    <div className={styles.field}>
                        <label>Color</label>
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                               style={{width: '100%', height: '40px', padding: 0, border: 'none'}}/>
                    </div>
                    <div className={styles.actions}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.saveBtn}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
