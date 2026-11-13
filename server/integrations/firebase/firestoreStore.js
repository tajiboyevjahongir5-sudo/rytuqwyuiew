import { FieldPath } from 'firebase-admin/firestore';
import { DocumentExistsError, DocumentNotFoundError } from '../../db/memoryStore.js';

// Cloud Firestore drayveri. MemoryStore bilan bir xil interfeys.
export class FirestoreStore {
  constructor(db) {
    this.driver = 'firestore';
    this.db = db;
  }

  _ref(collection, id) {
    return this.db.collection(collection).doc(String(id));
  }

  async get(collection, id) {
    const snap = await this._ref(collection, id).get();
    return snap.exists ? { ...snap.data(), id: snap.id } : null;
  }

  async create(collection, id, data) {
    try {
      await this._ref(collection, id).create(data);
    } catch (err) {
      if (err.code === 6 || err.code === 'already-exists') throw new DocumentExistsError(collection, id);
      throw err;
    }
    return { ...data, id: String(id) };
  }

  async set(collection, id, data, { merge = false } = {}) {
    await this._ref(collection, id).set(data, { merge });
  }

  async update(collection, id, patch) {
    try {
      await this._ref(collection, id).update(patch);
    } catch (err) {
      if (err.code === 5 || err.code === 'not-found') throw new DocumentNotFoundError(collection, id);
      throw err;
    }
  }

  async delete(collection, id) {
    await this._ref(collection, id).delete();
  }

  _build(collection, where = []) {
    let q = this.db.collection(collection);
    for (const [field, op, value] of where) q = q.where(field, op, value);
    return q;
  }

  async query(collection, { where = [], orderBy = [], limit, startAfterId } = {}) {
    let q = this._build(collection, where);
    for (const [field, dir = 'asc'] of orderBy) q = q.orderBy(field, dir);
    if (!orderBy.length) q = q.orderBy(FieldPath.documentId());
    if (startAfterId) {
      const cursor = await this._ref(collection, startAfterId).get();
      if (cursor.exists) q = q.startAfter(cursor);
    }
    if (limit) q = q.limit(limit);
    const snap = await q.get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  }

  async count(collection, { where = [] } = {}) {
    const snap = await this._build(collection, where).count().get();
    return snap.data().count;
  }

  async ping() {
    await this.db.collection('_health').limit(1).get();
    return true;
  }

  async close() {
    await this.db.terminate();
  }
}
