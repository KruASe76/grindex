import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '@app/hooks';
import {register} from '@features/auth/authSlice';
import styles from './RegisterPage.module.scss'; // Import SCSS module

export const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {isAuthenticated, loading, error} = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match!'); // Consider a more elegant error display
            return;
        }
        dispatch(register({full_name: fullName, email, password}));
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>Register</h1>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="regFullName" className={styles.label}>
                            Full Name:
                        </label>
                        <input
                            type="text"
                            id="regFullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="regEmail" className={styles.label}>
                            Email:
                        </label>
                        <input
                            type="email"
                            id="regEmail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="regPassword" className={styles.label}>
                            Password:
                        </label>
                        <input
                            type="password"
                            id="regPassword"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="regConfirmPassword" className={styles.label}>
                            Confirm Password:
                        </label>
                        <input
                            type="password"
                            id="regConfirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    {error && (
                        <p className={styles.error}>{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className={styles.linkText}>
                    Already have an account? <a href="/login" className={styles.link}>Login here</a>
                </p>
            </div>
        </div>
    );
};
