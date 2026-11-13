import fs from 'node:fs';
import path from 'node:path';
import { MemoryStore } from './memoryStore.js';

// Lokal ishlab chiqish uchun: ma'lumotlar JSON faylda saqlanadi, shuning uchun
// server qayta ishga tushganda progress yo'qolmaydi. Production uchun EMAS.
export class LocalStore extends MemoryStore {
  constructor(file) {
    let initial = {};
    if (fs.existsSync(file)) {
      initial = JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
    }
    super(initial);
    this.driver = 'local';
    this.file = file;
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }

  _changed() {
    const out = {};
    for (const [name, docs] of this.collections) out[name] = Object.fromEntries(docs);
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(out, null, 2));
    fs.renameSync(tmp, this.file); // atomar almashtirish
  }
}
