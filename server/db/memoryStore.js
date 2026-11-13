// Xotiradagi hujjatlar ombori. Firestore drayveri bilan bir xil interfeysga ega.
// Faqat testlar (memory) va lokal ishlab chiqish (local, faylga yoziladi) uchun.

const OPS = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  in: (a, b) => b.includes(a),
  'array-contains': (a, b) => Array.isArray(a) && a.includes(b),
};

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[keys.at(-1)] = value;
}

const clone = (v) => structuredClone(v);

export class DocumentExistsError extends Error {
  constructor(collection, id) {
    super(`Hujjat allaqachon mavjud: ${collection}/${id}`);
    this.code = 'ALREADY_EXISTS';
  }
}
export class DocumentNotFoundError extends Error {
  constructor(collection, id) {
    super(`Hujjat topilmadi: ${collection}/${id}`);
    this.code = 'NOT_FOUND';
  }
}

export class MemoryStore {
  constructor(initial = {}) {
    this.driver = 'memory';
    this.collections = new Map();
    for (const [name, docs] of Object.entries(initial)) {
      this.collections.set(name, new Map(Object.entries(docs)));
    }
  }

  _col(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return this.collections.get(name);
  }

  // Mutatsiyadan keyin chaqiriladi; LocalStore faylga yozish uchun qayta belgilaydi
  _changed() {}

  async get(collection, id) {
    const doc = this._col(collection).get(String(id));
    return doc ? { ...clone(doc), id: String(id) } : null;
  }

  async create(collection, id, data) {
    const col = this._col(collection);
    if (col.has(String(id))) throw new DocumentExistsError(collection, id);
    col.set(String(id), clone(data));
    this._changed();
    return { ...clone(data), id: String(id) };
  }

  async set(collection, id, data, { merge = false } = {}) {
    const col = this._col(collection);
    const prev = merge ? col.get(String(id)) ?? {} : {};
    col.set(String(id), { ...prev, ...clone(data) });
    this._changed();
  }

  /** Mavjud hujjatni yangilaydi. Kalitlar "stats.xp" kabi nuqtali yo'l bo'lishi mumkin. */
  async update(collection, id, patch) {
    const col = this._col(collection);
    const doc = col.get(String(id));
    if (!doc) throw new DocumentNotFoundError(collection, id);
    const next = clone(doc);
    for (const [path, value] of Object.entries(patch)) setPath(next, path, clone(value));
    col.set(String(id), next);
    this._changed();
  }

  async delete(collection, id) {
    this._col(collection).delete(String(id));
    this._changed();
  }

  _filter(collection, where = []) {
    let docs = [...this._col(collection).entries()].map(([id, d]) => ({ ...d, id }));
    for (const [field, op, value] of where) {
      const fn = OPS[op];
      if (!fn) throw new Error(`Qo'llab-quvvatlanmaydigan operator: ${op}`);
      docs = docs.filter((d) => {
        const v = getPath(d, field);
        return v !== undefined && fn(v, value);
      });
    }
    return docs;
  }

  /**
   * @param {object} q
   * @param {Array<[string,string,any]>} [q.where]
   * @param {Array<[string,'asc'|'desc']>} [q.orderBy]
   * @param {number} [q.limit]
   * @param {string} [q.startAfterId]  pagination kursori (oldingi sahifaning oxirgi hujjat id si)
   */
  async query(collection, { where = [], orderBy = [], limit, startAfterId } = {}) {
    let docs = this._filter(collection, where);
    const order = orderBy.length ? orderBy : [['id', 'asc']];
    docs.sort((a, b) => {
      for (const [field, dir = 'asc'] of order) {
        const av = getPath(a, field);
        const bv = getPath(b, field);
        if (av === bv) continue;
        const cmp = av > bv ? 1 : -1;
        return dir === 'desc' ? -cmp : cmp;
      }
      return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
    });
    if (startAfterId) {
      const idx = docs.findIndex((d) => d.id === String(startAfterId));
      docs = idx >= 0 ? docs.slice(idx + 1) : docs;
    }
    if (limit) docs = docs.slice(0, limit);
    return clone(docs);
  }

  async count(collection, { where = [] } = {}) {
    return this._filter(collection, where).length;
  }

  async ping() {
    return true;
  }

  async close() {}
}
