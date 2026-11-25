import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// TODO: Replace with your actual backend URL before running
export const BASE_URL = 'http://your-server:8080';

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('swiftship_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync('swiftship_token');
    }
    return Promise.reject(err);
  }
);
