import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/backend';
import styles from './Register.module.css'; 

export default function Register() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await register(username, email, password);
      
      if (result) {
        localStorage.setItem('token', result.accessToken);
        nav('/');
      } else {
        setError('Registration failed. Please try again.');
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
        {/* Left Side */}
        <div className={styles['left-panel']}>
          <div className={styles['logo']}>
            <h1>MoniPark</h1>
            <p>"From Parked Cars to Smart Starts"</p>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className={styles['right-panel']}>
          <div className={styles['container']}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              {error && (
                <div style={{ color: 'red', fontSize: '13px', marginBottom: '10px' }}>
                  {error}
                </div>
              )}

              <div className={styles['form-group']}>
                <label htmlFor="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => nav('/login')}
                style={{
                  background: 'transparent',
                  color: '#F5F5F7',
                  border: 'none',
                  marginTop: '12px',
                  cursor: 'pointer',
                }}
              >
                Already have an account? Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
