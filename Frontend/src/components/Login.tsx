import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/backend';
import styles from './Register.module.css'; // Reuse the same CSS module

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

    const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(username, password);
      
      if (result) {
        localStorage.setItem('token', result.accessToken);
        nav('/');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

 return (
    <div className={styles['page-wrapper']}>
      <div className={styles['split-container']}>
        <div className={styles['right-panel']}>
          <div className={styles['container']}>
            <h2>Login</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {error && (
                <div style={{ color: 'red', fontSize: '13px', marginBottom: '10px' }}>
                  {error}
                </div>
              )}

              <div className={styles['form-group']}>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => nav('/register')}
                style={{
                  background: 'transparent',
                  color: '#F5F5F7',
                  border: 'none',
                  marginTop: '12px',
                  cursor: 'pointer',
                }}
              >
                Don’t have an account? Register
              </button>
            </form>
          </div>
        </div>
        <div className={styles['left-panel']}>
          <div className={styles['logo']}>
            <h1>MoniPark</h1>
            <p>"An AI-driven car park monitoring solution tailored for SMEs — seamlessly integrating Real-Time Occupancy Tracking, Smart Vehicle Analytics, and Automated Visitor Insights. Unlock next-level efficiency by transforming parking spaces into data-powered growth hubs."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
