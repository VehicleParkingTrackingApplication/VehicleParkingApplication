import React from 'react';
import styles from './Register.module.css'; 

export default function Register() {
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
            <form>
              <div className={styles['form-group']}>
                <label htmlFor="name">Name</label>
                <input type="text" id="name" placeholder="Enter your full name" />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="Enter your email" />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="phone">Phone number</label>
                <input type="tel" id="phone" placeholder="Enter your phone number" />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" placeholder="Enter your password" />
              </div>

              <button type="submit">Register</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
