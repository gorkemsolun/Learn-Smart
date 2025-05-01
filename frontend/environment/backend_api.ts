import axios from "axios";

const baseURL = "http://localhost:8000";

// Create a new axios instance with a custom config for the backend
export const backendAPI = axios.create({
  baseURL: baseURL + "/api",
});

export const backend = axios.create({
  baseURL: baseURL,
});

export const authService = axios.create({
  baseURL: "http://127.0.0.1:8001/api/public"
});

export const chatService = axios.create({
  baseURL: "http://127.0.0.1:8002/api/public"
});

export const courseService = axios.create({
  baseURL: "http://127.0.0.1:8003/api/public"
});

export const filemanagerService = axios.create({
  baseURL: "http://127.0.0.1:8004/api/public"
});

export const userService = axios.create({
  baseURL: "http://127.0.0.1:8007/api/public"
});

export const skillTreeService = axios.create({
  baseURL: "http://127.0.0.1:8008/api/public"
});
