import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authService = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', new URLSearchParams({ username, password })),

  register: (data: any) => api.post('/api/auth/register', data),
};

export const chatService = {
  ask: (question: string, session_id?: number) =>
    api.post('/api/chat/ask', { question, session_id }),

  getSessions: () => api.get('/api/chat/sessions'),

  getMessages: (sessionId: number) =>
    api.get(`/api/chat/sessions/${sessionId}/messages`),
};

export const mikrotikService = {
  getStatus: () => api.get('/api/mikrotik/status'),

  getInterfaces: () => api.get('/api/mikrotik/interfaces'),

  applyHardening: () => api.post('/api/mikrotik/hardening'),

  createBackup: () => api.post('/api/mikrotik/backup'),
};

export default api;