import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "saarthitext_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error messages so UI always has something human-readable to show.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    let message = "Something went wrong. Please try again.";
    if (error.response) {
      const data = error.response.data;
      if (typeof data?.detail === "string") message = data.detail;
      else if (Array.isArray(data?.detail) && data.detail[0]?.msg)
        message = data.detail[0].msg;
      else if (error.response.status === 401) message = "Please log in to continue.";
    } else if (error.request) {
      message = "Cannot reach the server. Make sure the backend is running.";
    }
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export default api;
