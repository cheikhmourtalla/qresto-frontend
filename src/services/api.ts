import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter automatiquement le token JWT dans les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qresto_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.debug(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    return config;
  },
  (error) => {
    console.error(`[API] Erreur avant envoi de la requête`, error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    console.debug(
      `[API] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`
    );
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      console.warn(`[API] Session expirée | ${method} ${url}`);
      localStorage.removeItem('qresto_token');
      localStorage.removeItem('qresto_user');
      window.location.href = '/login';
    } else if (status === 403) {
      console.warn(`[API] Accès refusé | ${method} ${url} → ${message}`);
    } else if (status === 404) {
      console.warn(`[API] Ressource introuvable | ${method} ${url} → ${message}`);
    } else if (status >= 500) {
      console.error(`[API] Erreur serveur | ${method} ${url} → ${message}`);
    } else {
      console.warn(`[API] Erreur ${status} | ${method} ${url} → ${message}`);
    }

    return Promise.reject(error);
  }
);

export default api;