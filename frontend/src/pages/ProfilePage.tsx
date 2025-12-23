import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../app/hooks';
import {fetchUserProfile} from '@features/user/userProfileSlice';
import {setTheme} from '@features/ui/uiThemeSlice';
import {ChangePasswordModal} from '@features/user/ChangePasswordModal';
import styles from './ProfilePage.module.scss';

export const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const {profile, loading} = useAppSelector((state) => state.userProfile);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

    useEffect(() => {
        if (profile?.settings?.theme) {
            dispatch(setTheme(profile.settings.theme));
        }
    }, [profile?.settings?.theme, dispatch]);

    if (loading && !profile) return <div>Loading profile...</div>;

    return (
        <div className={styles.profile}>
            <h1>Profile</h1>
            <div className={styles.section}>
                <h3>User Information</h3>
                <div className={styles.sectionContent}>
                    <p><strong>Name:</strong> {profile?.full_name}</p>
                    <p><strong>Email:</strong> {profile?.email}</p>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Security</h3>
                <div className={styles.sectionContent}>
                    <button className={styles.changePasswordBtn} onClick={() => setShowModal(true)}>Change Password
                    </button>
                </div>
            </div>

            {showModal && <ChangePasswordModal onClose={() => setShowModal(false)}/>}
        </div>
    );
};
