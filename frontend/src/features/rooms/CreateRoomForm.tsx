import {useState} from 'react';
import {useAppDispatch} from '../../app/hooks';
import {addRoom} from './roomsSlice';
import styles from './CreateRoomForm.module.scss';

export const CreateRoomForm = () => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('');
    const [resolution, setResolution] = useState('day');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addRoom({name, resolution}));
        setName('');
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h3>Create Room</h3>
            <div className={styles.field}>
                <label htmlFor="roomName">Name</label>
                <input id="roomName" value={name} onChange={(e) => setName(e.target.value)} required/>
            </div>
            <div className={styles.field}>
                <label htmlFor="roomResolution">Resolution</label>
                <select id="roomResolution" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
            </div>
            <button type="submit" className={styles.submitBtn}>Create</button>
        </form>
    );
};
