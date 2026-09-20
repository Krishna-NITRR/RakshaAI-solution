import axios from 'axios';
import { getQueue, removeFromQueue, updateQueueItem } from './idb';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Offline Sync function
export async function syncOfflineQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return 0;
  
  try {
    const response = await api.post('/api/sync/batch', { items: queue });
    let synced = 0;
    for (const [index, result] of response.data.results.entries()) {
      const item = queue[index];
      if (result.ok) {
        await removeFromQueue(item.temp_uuid);
        synced++;
      } else {
        await updateQueueItem({ ...item, sync_state: 'error', retry_count: (item.retry_count || 0) + 1, last_error: result.error });
      }
    }
    return synced;
  } catch (err) {
    await Promise.all(queue.map((item) => updateQueueItem({ ...item, sync_state: 'error', retry_count: (item.retry_count || 0) + 1, last_error: err.message })));
    console.error('Failed to sync offline batch', err);
    return 0;
  }
}

export default api;
