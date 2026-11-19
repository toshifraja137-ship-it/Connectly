
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://connectly-4w9i.onrender.com/api",
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
