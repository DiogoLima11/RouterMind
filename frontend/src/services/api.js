import axios from "axios";

const API_URL = `http://${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 180000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const authService = {
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    return api.post("/api/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
  },
  register: (data) => api.post("/api/auth/register", data),
};

export const chatService = {
  ask: (question, session_id = null) =>
    api.post("/api/chat/ask", { question, session_id }),
  getSessions: () => api.get("/api/chat/sessions"),
  getMessages: (id) => api.get(`/api/chat/sessions/${id}/messages`),
};

export const mikrotikService = {
  getStatus:      () => api.get("/api/mikrotik/status"),
  getInterfaces:  () => api.get("/api/mikrotik/interfaces"),
  applyHardening: () => api.post("/api/mikrotik/hardening"),
  createBackup:   () => api.post("/api/mikrotik/backup"),
};

export default api;
