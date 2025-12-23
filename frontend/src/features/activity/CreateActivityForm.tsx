import {useState} from 'react';
import {useAppDispatch} from '../../app/hooks';
import {addActivity} from './activitySlice';
import styles from './CreateActivityForm.module.scss';

export const CreateActivityForm = () => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('📅');
    const [color, setColor] = useState('#0070f3');
    const [resolution, setResolution] = useState('day');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addActivity({name, emoji, color, resolution}));
        setName('');
        setEmoji('📅');
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h3>New Activity</h3>
            <div className={styles.field}>
                <label htmlFor="activityName">Name</label>
                <input id="activityName" value={name} onChange={(e) => setName(e.target.value)} required
                       data-testid="create-activity-input"/>
            </div>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label>Emoji</label>
                    <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className={styles.emojiInput}/>
                </div>
                <div className={styles.field}>
                    <label>Color</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)}/>
                </div>
            </div>
            <div className={styles.field}>
                <label>Resolution</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
            </div>
            <button type="submit" className={styles.submitBtn} data-testid="create-activity-btn">Create</button>
        </form>
    );
};
