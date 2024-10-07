import axios from "axios";

const baseURL = "http://localhost:8000";

// Create a new axios instance with a custom config for the backend
export const backendAPI = axios.create({
  baseURL: baseURL + "/api",
});

export const backend = axios.create({
  baseURL: baseURL,
});
