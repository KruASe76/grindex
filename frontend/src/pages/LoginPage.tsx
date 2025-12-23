import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '@app/hooks';
import {login} from '@features/auth/authSlice';
import styles from './LoginPage.module.scss'; // Import SCSS module

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        dispatch(login({email, password}));
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="loginEmail" className={styles.label}>
                            Email:
                        </label>
                        <input
                            type="email"
                            id="loginEmail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="loginPassword" className={styles.label}>
                            Password:
                        </label>
                        <input
                            type="password"
                            id="loginPassword"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className={styles.linkText}>
                    Don't have an account? <a href="/register" className={styles.link}>Register here</a>
                </p>
            </div>
        </div>
    );
};
