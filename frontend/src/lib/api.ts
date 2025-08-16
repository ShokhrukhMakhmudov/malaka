import axios from 'axios'
import process from 'process'

export const baseUrl =
  (import.meta as any).env.VITE_BASE_URL || process.env.VITE_BASE_URL

export const API = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
})

// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token')

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// API.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       const refreshed = await authStore.refreshToken();
//       if (refreshed) {
//         originalRequest.headers.Authorization = `Bearer ${cookies.get(
//           "access_token"
//         )}`;
//         return API(originalRequest);
//       }
//     }

//     return Promise.reject(error);
//   }
// );
