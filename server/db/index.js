import { MemoryStore } from './memoryStore.js';

/** Konfiguratsiyaga mos ma'lumotlar omborini yaratadi. */
export async function createStore(config) {
  switch (config.db.driver) {
    case 'firestore': {
      const { initFirestore } = await import('../integrations/firebase/admin.js');
      const { FirestoreStore } = await import('../integrations/firebase/firestoreStore.js');
      return new FirestoreStore(initFirestore(config.firebase));
    }
    case 'local': {
      const { LocalStore } = await import('./localStore.js');
      return new LocalStore(config.db.localFile);
    }
    default:
      return new MemoryStore();
  }
}
