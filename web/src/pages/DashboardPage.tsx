import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Tableau de bord</h1>
      <p>Bienvenue, {user?.full_name || user?.email}</p>
      <p>Rôle : {user?.role}</p>

      <button onClick={logout}>Se déconnecter</button>

      {/* 🔥 Nouveau menu principal corrigé */}
      <div style={{ marginTop: '30px' }}>
        <h3>Menu principal</h3>

        <div style={{ display: 'flex', gap: '15px' }}>
          
          {/* Clients */}
          <Link to="/clients">
            <button
              style={{
                padding: '15px 30px',
                cursor: 'pointer',
                backgroundColor: '#e9ecef'
              }}
            >
              👥 Gérer les Clients
            </button>
          </Link>

          {/* Véhicules */}
          <Link to="/vehicles">
            <button
              style={{
                padding: '15px 30px',
                cursor: 'pointer',
                backgroundColor: '#e9ecef'
              }}
            >
              🚗 Gérer les Véhicules
            </button>
          </Link>

          {/* Planning */}
          <Link to="/appointments">
            <button
              style={{
                padding: '15px 30px',
                cursor: 'pointer',
                backgroundColor: '#e9ecef'
              }}
            >
              📅 Planning / RDV
            </button>
          </Link>

          {/* Interventions */}
          <Link to="/interventions">
            <button
              style={{
                padding: '15px 30px',
                cursor: 'pointer',
                backgroundColor: '#e9ecef'
              }}
            >
              🛠️ Fiches Atelier
            </button>
          </Link>

        </div>
      </div>
    </div>
  );
};
