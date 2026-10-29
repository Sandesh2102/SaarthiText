import api, { tokenStore } from "./client";

export const authApi = {
  signup: async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    tokenStore.set(data.access_token);
    return data.user;
  },
  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    tokenStore.set(data.access_token);
    return data.user;
  },
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  updateMe: (payload) => api.patch("/auth/me", payload).then((r) => r.data),
  stats: () => api.get("/auth/me/stats").then((r) => r.data),
  logout: () => tokenStore.clear(),
};

export const metaApi = {
  get: () => api.get("/meta").then((r) => r.data),
};
