import axios from 'axios';

// L'URL de ton backend FastAPI lancé via Docker
const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cet intercepteur ajoute automatiquement le token de connexion 
// à chaque requête envoyée au serveur.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // On ajoute "Bearer <votre_token>" dans les entêtes HTTP
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
