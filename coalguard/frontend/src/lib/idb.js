import { openDB } from 'idb';

const DB_NAME = 'coalguard-offline';
const STORE_NAME = 'sync-queue';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'temp_uuid' });
      }
    },
  });
}

export async function addToQueue(inspectionData) {
  const db = await initDB();
  await db.put(STORE_NAME, {
    ...inspectionData,
    created_local_at: new Date().toISOString(),
    sync_state: 'pending',
    retry_count: 0,
    last_error: null,
  });
}

export async function getQueue() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function removeFromQueue(temp_uuid) {
  const db = await initDB();
  await db.delete(STORE_NAME, temp_uuid);
}

export async function updateQueueItem(item) {
  const db = await initDB();
  await db.put(STORE_NAME, item);
}
