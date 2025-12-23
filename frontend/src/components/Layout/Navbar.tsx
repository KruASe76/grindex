import {LogOut, Moon, Sun} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {toggleTheme} from '../../features/ui/uiThemeSlice';
import {logout} from '../../features/auth/authSlice';
import styles from './Navbar.module.scss';

export const Navbar = () => {
    const dispatch = useAppDispatch();
    const theme = useAppSelector((state) => state.uiTheme.mode);
    const {isAuthenticated} = useAppSelector((state) => state.auth);
    const user = useAppSelector((state) => state.userProfile.profile);

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>Grindex</div>
            {isAuthenticated && (
                <div className={styles.links}>
                    <NavLink
                        to="/dashboard"
                        className={({isActive}) => isActive ? `${styles.link} ${styles.active}` : styles.link}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/rooms"
                        className={({isActive}) => isActive ? `${styles.link} ${styles.active}` : styles.link}
                    >
                        Rooms
                    </NavLink>
                    <NavLink
                        to="/profile"
                        className={({isActive}) => isActive ? `${styles.link} ${styles.active}` : styles.link}
                    >
                        Profile
                    </NavLink>
                </div>
            )}
            <div className={styles.actions}>
                <button onClick={() => dispatch(toggleTheme())} className={styles.iconButton}>
                    {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
                </button>
                {isAuthenticated && (
                    <>
                        <span className={styles.username}>{user?.full_name}</span>
                        <button onClick={() => dispatch(logout())} className={styles.iconButton} aria-label="Logout">
                            <LogOut size={20}/>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};
