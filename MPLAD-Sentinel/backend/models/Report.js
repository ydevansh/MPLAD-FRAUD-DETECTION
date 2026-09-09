import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '../data/reports.json');

let _cache = null;
function load() { if (!_cache) _cache = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); return _cache; }
function save(data) { _cache = data; fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }

export const Report = {
  findAll(filters = {}) {
    let data = load();
    const { project_id, status, page = 1, limit = 20 } = filters;
    if (project_id) data = data.filter(r => r.project_id === project_id);
    if (status) data = data.filter(r => r.status === status);
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = data.length;
    const offset = (page - 1) * limit;
    return { data: data.slice(offset, offset + parseInt(limit)), total };
  },

  findByProject(projectId) {
    return load().filter(r => r.project_id === projectId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  findById(id) { return load().find(r => r.id === id) || null; },

  create(reportData) {
    const data = load();
    const reportCounter = data.length + 1;
    const report = {
      id: `RPT-${String(reportCounter).padStart(4, '0')}`,
      ...reportData,
      evidence_consistency_score: null,
      is_verified: false,
      status: 'pending',
      created_at: new Date().toISOString().split('T')[0],
    };
    data.push(report);
    save(data);
    return report;
  },

  update(id, updates) {
    const data = load();
    const idx = data.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates };
    save(data);
    return data[idx];
  },

  getRecentReports(limit = 10) {
    return load()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  countByProject(projectId) {
    return load().filter(r => r.project_id === projectId).length;
  },
};
