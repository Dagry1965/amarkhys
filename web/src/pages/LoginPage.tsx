import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Identifiants invalides');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Connexion - Amarkhys ERP</h1>
      <form onSubmit={handleSubmit}>
        <div><label>Email: </label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div style={{ marginTop: '10px' }}><label>Mot de passe: </label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ marginTop: '10px' }}>Se connecter</button>
      </form>
    </div>
  );
};
