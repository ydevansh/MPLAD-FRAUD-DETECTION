import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '../data/analyses.json');

let _cache = null;
function load() { if (!_cache) _cache = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); return _cache; }
function save(data) { _cache = data; fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }

export const Analysis = {
  findByProject(projectId) {
    return load()
      .filter(a => a.project_id === projectId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getLatestForProject(projectId) {
    const results = load()
      .filter(a => a.project_id === projectId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return results[0] || null;
  },

  create(analysisData) {
    const data = load();
    const counter = data.length + 1;
    const analysis = {
      id: `ANAL-${String(counter).padStart(4, '0')}`,
      ...analysisData,
      created_at: new Date().toISOString().split('T')[0],
    };
    data.push(analysis);
    save(data);
    return analysis;
  },

  getAll() { return load(); },
};
