import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';

export const ClientsPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState('');

  const fetchClients = async () => {
    const res = await apiClient.get('/clients');
    setClients(res.data);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post('/clients', { name });
    setName('');
    fetchClients();
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Dashboard</Link>
      <h1>Clients</h1>
      <form onSubmit={handleAdd}><input placeholder="Nom" value={name} onChange={e => setName(e.target.value)} required /><button type="submit">Ajouter</button></form>
      <ul>{clients.map(c => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  );
};
