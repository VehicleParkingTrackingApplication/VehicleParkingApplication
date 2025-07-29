import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css'; // Reuse the same CSS module

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:1313'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('user', JSON.stringify(data.user || {}));
        nav('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
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
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
