import api from "./client";

export const documentsApi = {
  list: (params = {}) => api.get("/documents", { params }).then((r) => r.data),
  get: (id) => api.get(`/documents/${id}`).then((r) => r.data),
  createText: (payload) => api.post("/documents/text", payload).then((r) => r.data),
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  process: (id, language) =>
    api.post(`/documents/${id}/process`, { language }).then((r) => r.data),
  ask: (id, question) =>
    api.post(`/documents/${id}/ask`, { question }).then((r) => r.data),
  remove: (id) => api.delete(`/documents/${id}`),
  reportUrl: (id) => `${import.meta.env.VITE_API_BASE_URL || "/api"}/documents/${id}/report`,
  downloadReport: (id) =>
    api.get(`/documents/${id}/report`, { responseType: "blob" }).then((r) => r.data),
};
