import axios from 'axios';

const baseURL =
  typeof import.meta.env.VITE_API_BASE_URL === 'string' &&
  import.meta.env.VITE_API_BASE_URL.trim() !== ''
    ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
    : 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

export async function checkHealth(): Promise<{ ok: boolean }> {
  await apiClient.get('/health');
  return { ok: true };
}
