import {useEffect, useState} from 'react';
import type {Activity} from './activitySlice';
import styles from './LogTimeModal.module.scss';
import {X} from 'lucide-react';

interface LogTimeModalProps {
    activity: Activity;
    onClose: () => void;
    onSave: (date: string, duration: number) => void;
}

export const LogTimeModal = ({activity, onClose, onSave}: LogTimeModalProps) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [hours, setHours] = useState(1);
    const [minutes, setMinutes] = useState(0);

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
        const totalMinutes = hours * 60 + minutes;
        onSave(date, totalMinutes);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={20}/>
                </button>
                <h3>Log Time for {activity.name}</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label htmlFor="logDate">Date</label>
                        <input id="logDate" type="date" value={date} onChange={(e) => setDate(e.target.value)}/>
                    </div>
                    <div className={styles.durationRow}>
                        <div className={styles.field}>
                            <label htmlFor="logHours">Hours</label>
                            <input id="logHours" type="number" min="0" value={hours}
                                   onChange={(e) => setHours(Number(e.target.value))}/>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="logMinutes">Minutes</label>
                            <input id="logMinutes" type="number" min="0" max="59" value={minutes}
                                   onChange={(e) => setMinutes(Number(e.target.value))}/>
                        </div>
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
