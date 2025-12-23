import React, {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {changePassword} from './userProfileSlice';
import styles from './ChangePasswordModal.module.scss';
import {X} from 'lucide-react';

interface ChangePasswordModalProps {
    onClose: () => void;
}

export const ChangePasswordModal = ({onClose}: ChangePasswordModalProps) => {
    const dispatch = useAppDispatch();
    const {loading} = useAppSelector((state) => state.userProfile);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        const resultAction = await dispatch(changePassword({old_password: oldPassword, new_password: newPassword}));
        if (changePassword.fulfilled.match(resultAction)) {
            setSuccess("Password changed successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(onClose, 2000); // Close after 2s on success
        } else {
            setError(resultAction.payload as string || 'Failed to change password.');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={20}/>
                </button>
                <h3>Change Password</h3>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="oldPassword">Old Password</label>
                        <input type="password" id="oldPassword" value={oldPassword}
                               onChange={(e) => setOldPassword(e.target.value)} required/>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="newPassword">New Password</label>
                        <input type="password" id="newPassword" value={newPassword}
                               onChange={(e) => setNewPassword(e.target.value)} required/>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword" value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)} required/>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    {success && <p className={styles.success}>{success}</p>}
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
