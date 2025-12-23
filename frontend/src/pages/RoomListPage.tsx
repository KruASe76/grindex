import {RoomList} from '@features/rooms/RoomList';
import {CreateRoomForm} from '@features/rooms/CreateRoomForm';
import styles from './RoomListPage.module.scss';

export const RoomListPage = () => {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Rooms</h1>
            </div>
            <div className={styles.content}>
                <div className={styles.main}>
                    <RoomList/>
                </div>
                <div className={styles.side}>
                    <CreateRoomForm/>
                </div>
            </div>
        </div>
    );
};
