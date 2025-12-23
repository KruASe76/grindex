import {useEffect} from 'react';
import {Outlet} from 'react-router-dom';
import {Navbar} from './Navbar';
import {LiveTracker} from '../../features/tracker/LiveTracker';
import {useSocketConnection} from '../../features/tracker/useSocketConnection';
import {useAppDispatch} from '../../app/hooks';
import {fetchLiveStatus} from '../../features/tracker/liveStatusSlice';
import styles from './Layout.module.scss';

export const Layout = () => {
    useSocketConnection();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchLiveStatus());
    }, [dispatch]);

    return (
        <div className={styles.layout}>
            <Navbar/>
            <main className={styles.main}>
                <Outlet/>
            </main>
            <LiveTracker/>
        </div>
    );
};
