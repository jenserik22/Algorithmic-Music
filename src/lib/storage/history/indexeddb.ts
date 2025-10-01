import { DEFAULT_CAP, GenerationRecord, HistoryAdapter } from './types';

const DB_VERSION = 1;
const STORE = 'generations';

export class IndexedDbHistoryAdapter implements HistoryAdapter {
  constructor(private dbName = 'algo_music_history', private cap = DEFAULT_CAP) {}

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  private async enforceCap(db: IDBDatabase): Promise<void> {
    const store = this.tx(db, 'readwrite');
    const idx = store.index('createdAt');
    const items: GenerationRecord[] = await new Promise((resolve, reject) => {
      const out: GenerationRecord[] = [];
      const req = idx.openCursor(null, 'prev'); // newest-first
      req.onsuccess = () => {
        const cursor = req.result as IDBCursorWithValue | null;
        if (!cursor) return resolve(out);
        out.push(cursor.value as GenerationRecord);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    if (items.length > this.cap) {
      const toDelete = items.slice(this.cap);
      await Promise.all(
        toDelete.map(rec =>
          new Promise<void>((resolve, reject) => {
            const delReq = store.delete(rec.id);
            delReq.onsuccess = () => resolve();
            delReq.onerror = () => reject(delReq.error);
          })
        )
      );
    }
  }

  async add(r: Omit<GenerationRecord, 'id' | 'createdAt'> & Partial<Pick<GenerationRecord, 'createdAt'>>): Promise<GenerationRecord> {
    const db = await this.open();
    const rec: GenerationRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: r.createdAt ?? Date.now(),
      algorithm: r.algorithm,
      params: r.params,
    };
    await new Promise<void>((resolve, reject) => {
      const putReq = this.tx(db, 'readwrite').put(rec);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
    await this.enforceCap(db);
    db.close();
    return rec;
  }

  async list(): Promise<GenerationRecord[]> {
    const db = await this.open();
    const store = this.tx(db, 'readonly');
    const idx = store.index('createdAt');
    const out: GenerationRecord[] = await new Promise((resolve, reject) => {
      const arr: GenerationRecord[] = [];
      const req = idx.openCursor(null, 'prev');
      req.onsuccess = () => {
        const cursor = req.result as IDBCursorWithValue | null;
        if (!cursor) return resolve(arr);
        arr.push(cursor.value as GenerationRecord);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return out;
  }

  async get(id: string): Promise<GenerationRecord | undefined> {
    const db = await this.open();
    const rec = await new Promise<GenerationRecord | undefined>((resolve, reject) => {
      const req = this.tx(db, 'readonly').get(id);
      req.onsuccess = () => resolve(req.result as GenerationRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rec;
  }

  async remove(id: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const req = this.tx(db, 'readwrite').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  }

  async clear(): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const req = this.tx(db, 'readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  }

  async count(): Promise<{ count: number; saturated: boolean }> {
    const db = await this.open();
    const count = await new Promise<number>((resolve, reject) => {
      const req = this.tx(db, 'readonly').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return { count, saturated: count >= this.cap };
  }
}
