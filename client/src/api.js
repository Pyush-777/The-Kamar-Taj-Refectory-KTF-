
import axios from "axios";

// Base URL of your Express backend
const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

// Attach the saved JWT to protected requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
