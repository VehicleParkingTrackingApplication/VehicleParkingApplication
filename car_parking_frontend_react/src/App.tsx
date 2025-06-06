import { useState } from 'react'
import type { ChangeEvent } from 'react'

const baseApi = 'http://localhost:1313/api';

function App() {
  const [fields, setFields] = useState({
    username: 'binhUser',
    password: '123'
  });
  const setFieldValue = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetch(`${baseApi}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fields)
    })
    .then(res => res.json())

    .then(user => {
      console.log(user);
    });
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <label htmlFor="username">Email</label>
        <br />
        <input 
          type="text" 
          name="username"
          value={fields.username}
          onChange={setFieldValue}
          id="username"
        />
        <br />
        <input 
          type="password" 
          name="password"
          value={fields.password}
          onChange={setFieldValue}
          id="password"
        />
        <br />
        <button>Login</button>      
      </form>

    </div>
  )
}

export default App
