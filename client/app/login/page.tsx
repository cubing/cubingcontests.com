'use client';
import { useState } from 'react';
import { API_BASE_URL } from '~/helpers/configuration';

const Login = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const tempErrors: string[] = [];

    if (!username) tempErrors.push('Please enter a username');
    if (!password) tempErrors.push('Please enter a password');

    if (username && password) {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();

      if (!json.access_token) {
        tempErrors.push(json.message);
      } else {
        setErrorMessages([]);
        localStorage.setItem('jwtToken', `Bearer ${json.access_token}`);
        window.location.href = '/';
      }
    }

    setErrorMessages(tempErrors);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Login</h2>
      <form className="mt-4 mx-auto fs-5" style={{ width: '720px' }} onSubmit={(e: any) => handleSubmit(e)}>
        {errorMessages?.map((message, index) => (
          <div key={index} className="alert alert-danger" role="alert">
            {message}
          </div>
        ))}

        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e: any) => setUsername(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="text"
            id="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            className="form-control"
          />
        </div>

        <button type="submit" className="mt-4 btn btn-primary">
          Login
        </button>
      </form>
    </>
  );
};

export default Login;
