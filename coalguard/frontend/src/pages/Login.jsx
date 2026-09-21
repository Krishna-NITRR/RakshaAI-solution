import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { saveSession } from '../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      saveSession(res.data);
      
      if (res.data.role === 'r-corporate') {
        navigate('/corporate');
      } else if (res.data.role === 'r-manager' && res.data.mine_id) {
        navigate(`/mine/${res.data.mine_id}`);
      } else {
        navigate('/inspect');
      }
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="text-3xl text-center mb-6" style={{ color: 'var(--primary)' }}>CoalGuard</h2>
        {error && <div className="status-badge status-red mb-4 text-center" style={{ width: '100%' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="inspector.c@demo.com" 
              required
            />
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="demo123" 
              required
            />
          </div>
          <button className="btn-primary" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
