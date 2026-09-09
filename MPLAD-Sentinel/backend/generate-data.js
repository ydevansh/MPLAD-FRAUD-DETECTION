// MPLAD-Sentinel Data Seed Script
// Run: node generate-data.js
// Generates 150 realistic MPLADS projects with embedded fraud patterns

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');

// ─── Reference Data ───────────────────────────────────────────────────────────
const STATES = [
  { name: 'Uttar Pradesh', code: 'UP' },
  { name: 'Maharashtra', code: 'MH' },
  { name: 'Bihar', code: 'BR' },
  { name: 'Rajasthan', code: 'RJ' },
  { name: 'Madhya Pradesh', code: 'MP' },
];

const CONSTITUENCIES = {
  UP: [
    { name: 'Lucknow', mp: 'Rajnath Singh', district: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Varanasi', mp: 'Narendra Modi', district: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { name: 'Allahabad', mp: 'Rita Bahuguna Joshi', district: 'Prayagraj', lat: 25.4358, lng: 81.8463 },
    { name: 'Agra', mp: 'SP Singh Baghel', district: 'Agra', lat: 27.1767, lng: 78.0081 },
  ],
  MH: [
    { name: 'Mumbai North', mp: 'Gopal Shetty', district: 'Mumbai', lat: 19.2183, lng: 72.9781 },
    { name: 'Pune', mp: 'Girish Bapat', district: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Nagpur', mp: 'Nitin Gadkari', district: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Nashik', mp: 'Hemant Godse', district: 'Nashik', lat: 20.0059, lng: 73.7901 },
  ],
  BR: [
    { name: 'Patna Sahib', mp: 'Ravi Shankar Prasad', district: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Muzaffarpur', mp: 'Ajay Nishad', district: 'Muzaffarpur', lat: 26.1197, lng: 85.3910 },
    { name: 'Gaya', mp: 'Vijay Manjhi', district: 'Gaya', lat: 24.7914, lng: 84.9994 },
    { name: 'Bhagalpur', mp: 'Ajay Kumar Mandal', district: 'Bhagalpur', lat: 25.2445, lng: 86.9718 },
  ],
  RJ: [
    { name: 'Jaipur', mp: 'Ramcharan Bohra', district: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Jodhpur', mp: 'Gajendra Singh Shekhawat', district: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
    { name: 'Bikaner', mp: 'Arjun Ram Meghwal', district: 'Bikaner', lat: 28.0229, lng: 73.3119 },
    { name: 'Udaipur', mp: 'Manashwi Patel', district: 'Udaipur', lat: 24.5854, lng: 73.7125 },
  ],
  MP: [
    { name: 'Bhopal', mp: 'Sadhvi Pragya Singh Thakur', district: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Indore', mp: 'Shankar Lalwani', district: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Gwalior', mp: 'Vivek Narayan Shejwalkar', district: 'Gwalior', lat: 26.2183, lng: 78.1828 },
    { name: 'Jabalpur', mp: 'Rakesh Singh', district: 'Jabalpur', lat: 23.1815, lng: 79.9864 },
  ],
};

const WORK_TYPES = [
  'Road Construction', 'Drain Construction', 'Community Hall', 'Primary School Renovation',
  'Health Sub-Centre', 'Water Supply Scheme', 'Solar Street Lights', 'Bus Shelter',
  'Sports Facility', 'Pond Renovation / Deepening', 'Anganwadi Centre', 'Cremation Ground',
  'Village Electrification', 'Toilet Block Construction', 'Bridge Construction',
];

const CONTRACTORS = [
  'Shivam Constructions', 'Hari Om Builders', 'Balaji Infrastructure', 'Jai Durga Works',
  'National Constructions Ltd', 'Krishna Infra', 'Radhey Shyam & Co.', 'Om Prakash Builders',
  'Singh Construction Co.', 'Laxmi Narayan Civil Works', 'Saraswati Constructions',
  'Durga Prasad & Sons', 'Patel Engineering', 'Sharma & Associates', 'Rajput Civil Works',
];

const IMPLEMENTING_AGENCIES = [
  'District Panchayat', 'Municipal Council', 'Public Works Department', 'Rural Engineering Service',
  'Zila Parishad', 'Nagar Panchayat', 'Block Development Office', 'State Highway Authority',
];

const BASE_COSTS = {
  'Road Construction': 45,
  'Drain Construction': 18,
  'Community Hall': 35,
  'Primary School Renovation': 22,
  'Health Sub-Centre': 30,
  'Water Supply Scheme': 40,
  'Solar Street Lights': 12,
  'Bus Shelter': 8,
  'Sports Facility': 25,
  'Pond Renovation / Deepening': 20,
  'Anganwadi Centre': 15,
  'Cremation Ground': 10,
  'Village Electrification': 20,
  'Toilet Block Construction': 9,
  'Bridge Construction': 65,
};

const PHOTO_POOL = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
  'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=800',
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
  'https://images.unsplash.com/photo-1470723710355-95304d8aece4?w=800',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const fmtDate = (d) => new Date(d).toISOString().split('T')[0];
const today = new Date('2024-09-01');

function getConstituency(stateCode) {
  return pick(CONSTITUENCIES[stateCode]);
}

function jitter(lat, lng, radiusKm = 0.05) {
  const latDelta = (Math.random() - 0.5) * 2 * radiusKm / 111;
  const lngDelta = (Math.random() - 0.5) * 2 * radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  return { lat: parseFloat((lat + latDelta).toFixed(5)), lng: parseFloat((lng + lngDelta).toFixed(5)) };
}

function computeRiskScore(flags) {
  const WEIGHTS = {
    COST_OUTLIER: 20,
    EXPENDITURE_PROGRESS_MISMATCH: 25,
    STALLED_PROJECT: 15,
    DUPLICATE_PROJECT: 20,
    PHOTO_REUSE: 15,
    SUSPICIOUS_CLUSTERING: 15,
    PAYMENT_SPIKE: 10,
    CITIZEN_DISCREPANCY: 25,
  };
  const raw = flags.reduce((sum, f) => sum + (WEIGHTS[f] || 0), 0);
  return Math.min(raw, 100);
}

function riskLevel(score) {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

// ─── Project Builders ─────────────────────────────────────────────────────────
let counter = 1;

function baseProject(stateCode, overrides = {}) {
  const state = STATES.find(s => s.code === stateCode);
  const constituency = getConstituency(stateCode);
  const workType = pick(WORK_TYPES);
  const baseCost = BASE_COSTS[workType] || 20;
  const sanctionedAmount = parseFloat((baseCost * rand(0.8, 1.3)).toFixed(2));
  const sanctionDate = fmtDate(addDays('2021-04-01', randInt(0, 900)));
  const expectedCompletion = addDays(sanctionDate, randInt(180, 365));
  const { lat, lng } = jitter(constituency.lat, constituency.lng, 0.15);

  const id = `PROJ-${String(counter++).padStart(4, '0')}`;

  return {
    id,
    title: `${workType} at ${constituency.name} Ward ${randInt(1, 40)}`,
    mp_name: constituency.mp,
    constituency: constituency.name,
    state: state.name,
    district: constituency.district,
    work_type: workType,
    sanctioned_amount: sanctionedAmount,
    expended_amount: 0,
    physical_progress_pct: 0,
    financial_progress_pct: 0,
    status: 'in_progress',
    implementing_agency: pick(IMPLEMENTING_AGENCIES),
    contractor_name: pick(CONTRACTORS),
    lat,
    lng,
    sanction_date: sanctionDate,
    expected_completion: expectedCompletion,
    actual_completion: null,
    official_photos: [pick(PHOTO_POOL), pick(PHOTO_POOL)],
    description: `Development work sanctioned under MPLADS for ${workType.toLowerCase()} in ${constituency.name} constituency.`,
    anomaly_flags: [],
    risk_score: 0,
    risk_level: 'low',
    citizen_report_count: 0,
    created_at: sanctionDate,
    updated_at: sanctionDate,
    ...overrides,
  };
}

const projects = [];

// ─── 1. Clean Projects (60) ───────────────────────────────────────────────────
['UP', 'MH', 'BR', 'RJ', 'MP'].forEach(stateCode => {
  for (let i = 0; i < 12; i++) {
    const p = baseProject(stateCode);
    const phys = randInt(30, 100);
    const fin = Math.min(phys + randInt(-5, 5), 100);
    const spent = parseFloat((p.sanctioned_amount * fin / 100).toFixed(2));
    const isComplete = phys === 100;
    p.physical_progress_pct = phys;
    p.financial_progress_pct = Math.max(0, fin);
    p.expended_amount = spent;
    p.status = isComplete ? 'completed' : phys > 0 ? 'in_progress' : 'sanctioned';
    if (isComplete) p.actual_completion = addDays(p.expected_completion, randInt(-30, 30));
    p.risk_score = 0;
    p.risk_level = 'low';
    projects.push(p);
  }
});

// ─── 2. Cost Outlier Projects (15) ───────────────────────────────────────────
for (let i = 0; i < 15; i++) {
  const stateCode = pick(['UP', 'MH', 'BR', 'RJ', 'MP']);
  const p = baseProject(stateCode);
  p.sanctioned_amount = parseFloat((p.sanctioned_amount * rand(2.8, 4.5)).toFixed(2));
  p.expended_amount = parseFloat((p.sanctioned_amount * rand(0.5, 0.9)).toFixed(2));
  p.physical_progress_pct = randInt(40, 70);
  p.financial_progress_pct = randInt(50, 90);
  p.status = 'in_progress';
  p.anomaly_flags = ['COST_OUTLIER'];
  p.risk_score = computeRiskScore(p.anomaly_flags);
  p.risk_level = riskLevel(p.risk_score);
  projects.push(p);
}

// ─── 3. Progress Mismatch Projects (20) ──────────────────────────────────────
for (let i = 0; i < 20; i++) {
  const stateCode = pick(['UP', 'MH', 'BR', 'RJ', 'MP']);
  const p = baseProject(stateCode);
  const financial = randInt(80, 97);
  const physical = randInt(15, 45);
  p.financial_progress_pct = financial;
  p.physical_progress_pct = physical;
  p.expended_amount = parseFloat((p.sanctioned_amount * financial / 100).toFixed(2));
  p.status = 'in_progress';
  p.anomaly_flags = ['EXPENDITURE_PROGRESS_MISMATCH'];
  if (financial - physical > 50) p.anomaly_flags.push('PAYMENT_SPIKE');
  p.risk_score = computeRiskScore(p.anomaly_flags);
  p.risk_level = riskLevel(p.risk_score);
  projects.push(p);
}

// ─── 4. Photo Reuse Projects (10) — 5 pairs sharing same photo ───────────────
const REUSED_PHOTO = PHOTO_POOL[0];
for (let i = 0; i < 10; i++) {
  const stateCode = pick(['UP', 'MH', 'BR', 'RJ', 'MP']);
  const p = baseProject(stateCode);
  const phys = randInt(70, 100);
  p.physical_progress_pct = phys;
  p.financial_progress_pct = phys + randInt(-5, 5);
  p.expended_amount = parseFloat((p.sanctioned_amount * p.financial_progress_pct / 100).toFixed(2));
  p.status = phys === 100 ? 'completed' : 'in_progress';
  if (phys === 100) p.actual_completion = addDays(p.expected_completion, randInt(-10, 60));
  p.official_photos = [REUSED_PHOTO, REUSED_PHOTO];
  p.anomaly_flags = ['PHOTO_REUSE'];
  p.risk_score = computeRiskScore(p.anomaly_flags);
  p.risk_level = riskLevel(p.risk_score);
  projects.push(p);
}

// ─── 5. Duplicate Projects (10) — 5 pairs ───────────────────────────────────
for (let i = 0; i < 5; i++) {
  const stateCode = pick(['UP', 'MH', 'BR', 'RJ', 'MP']);
  const original = baseProject(stateCode);
  const workType = original.work_type;
  original.physical_progress_pct = 80;
  original.financial_progress_pct = 85;
  original.expended_amount = parseFloat((original.sanctioned_amount * 0.85).toFixed(2));
  original.status = 'in_progress';
  original.anomaly_flags = ['DUPLICATE_PROJECT'];
  original.risk_score = computeRiskScore(original.anomaly_flags);
  original.risk_level = riskLevel(original.risk_score);
  projects.push(original);

  const duplicate = {
    ...original,
    id: `PROJ-${String(counter++).padStart(4, '0')}`,
    title: `${workType} at ${original.constituency} Ward ${randInt(1, 40)} (Phase II)`,
    contractor_name: original.contractor_name,
    lat: parseFloat((original.lat + 0.001).toFixed(5)),
    lng: parseFloat((original.lng + 0.001).toFixed(5)),
    sanction_date: addDays(original.sanction_date, randInt(30, 90)),
    anomaly_flags: ['DUPLICATE_PROJECT'],
  };
  duplicate.risk_score = computeRiskScore(duplicate.anomaly_flags);
  duplicate.risk_level = riskLevel(duplicate.risk_score);
  projects.push(duplicate);
}

// ─── 6. Stalled Projects (15) ────────────────────────────────────────────────
for (let i = 0; i < 15; i++) {
  const stateCode = pick(['UP', 'MH', 'BR', 'RJ', 'MP']);
  const p = baseProject(stateCode);
  p.sanction_date = fmtDate(addDays('2020-01-01', randInt(0, 365)));
  p.expected_completion = addDays(p.sanction_date, 365);
  p.physical_progress_pct = randInt(20, 55);
  p.financial_progress_pct = randInt(30, 60);
  p.expended_amount = parseFloat((p.sanctioned_amount * p.financial_progress_pct / 100).toFixed(2));
  p.status = 'stalled';
  p.updated_at = fmtDate(addDays('2021-06-01', randInt(0, 180)));
  p.anomaly_flags = ['STALLED_PROJECT'];
  p.risk_score = computeRiskScore(p.anomaly_flags);
  p.risk_level = riskLevel(p.risk_score);
  projects.push(p);
}

// ─── 7. Contractor Clustering (10) ───────────────────────────────────────────
const CLUSTER_CONTRACTOR = 'Hari Om Builders';
const CLUSTER_STATE = 'UP';
const CLUSTER_CONSTITUENCY = CONSTITUENCIES.UP[0]; // Lucknow
for (let i = 0; i < 10; i++) {
  const p = baseProject(CLUSTER_STATE);
  p.constituency = CLUSTER_CONSTITUENCY.name;
  p.mp_name = CLUSTER_CONSTITUENCY.mp;
  p.contractor_name = CLUSTER_CONTRACTOR;
  const { lat, lng } = jitter(CLUSTER_CONSTITUENCY.lat, CLUSTER_CONSTITUENCY.lng, 0.05);
  p.lat = lat; p.lng = lng;
  const phys = randInt(60, 100);
  p.physical_progress_pct = phys;
  p.financial_progress_pct = Math.min(phys + 10, 100);
  p.expended_amount = parseFloat((p.sanctioned_amount * p.financial_progress_pct / 100).toFixed(2));
  p.status = phys >= 100 ? 'completed' : 'in_progress';
  p.anomaly_flags = ['SUSPICIOUS_CLUSTERING'];
  if (i < 3) p.anomaly_flags.push('COST_OUTLIER');
  p.risk_score = computeRiskScore(p.anomaly_flags);
  p.risk_level = riskLevel(p.risk_score);
  projects.push(p);
}

// ─── 8. Citizen Discrepancy Projects (10) ────────────────────────────────────
const discrepancyProjectIds = [];
for (let i = 0; i < 10; i++) {
  const stateCode = pick(['UP', 'MH', 'BR', 'RJ', 'MP']);
  const p = baseProject(stateCode);
  p.physical_progress_pct = 100;
  p.financial_progress_pct = 100;
  p.expended_amount = p.sanctioned_amount;
  p.status = 'completed';
  p.actual_completion = addDays(p.expected_completion, randInt(-30, 0));
  p.anomaly_flags = ['CITIZEN_DISCREPANCY'];
  if (i % 2 === 0) p.anomaly_flags.push('PHOTO_REUSE');
  if (i % 3 === 0) p.anomaly_flags.push('EXPENDITURE_PROGRESS_MISMATCH');
  p.citizen_report_count = randInt(3, 8);
  p.risk_score = computeRiskScore(p.anomaly_flags);
  p.risk_level = riskLevel(p.risk_score);
  discrepancyProjectIds.push(p.id);
  projects.push(p);
}

// ─── Citizen Reports (for discrepancy + some others) ────────────────────────
const CONDITIONS = ['partially_complete', 'not_started', 'damaged', 'non_existent'];
const DISCREPANCIES = ['Work not done', 'Poor quality material used', 'Structure collapsed', 'Site is empty', 'Work abandoned', 'Different work done than reported'];

const reports = [];
let reportCounter = 1;

discrepancyProjectIds.forEach(projectId => {
  const project = projects.find(p => p.id === projectId);
  const count = project.citizen_report_count;
  for (let i = 0; i < count; i++) {
    const { lat, lng } = jitter(project.lat, project.lng, 0.02);
    reports.push({
      id: `RPT-${String(reportCounter++).padStart(4, '0')}`,
      project_id: projectId,
      reporter_name: null,
      reporter_contact: null,
      description: pick(DISCREPANCIES) + '. The official records claim completion but site visit shows otherwise.',
      reported_condition: pick(CONDITIONS),
      discrepancy_type: 'completion_claim',
      photo_url: null,
      lat,
      lng,
      evidence_consistency_score: parseFloat(rand(0.6, 0.95).toFixed(2)),
      is_verified: false,
      status: 'pending',
      created_at: addDays('2024-01-01', randInt(0, 240)),
    });
  }
});

// ─── AI Analyses (for high-risk projects) ────────────────────────────────────
const analyses = [];
let analysisCounter = 1;

const FLAG_NARRATIVES = {
  COST_OUTLIER: 'The sanctioned amount for this project is significantly higher than the state average for similar works.',
  EXPENDITURE_PROGRESS_MISMATCH: 'Over 80% of funds have been released but physical progress remains below 40%, indicating a serious discrepancy.',
  STALLED_PROJECT: 'This project has shown no progress update for over 18 months and remains incomplete past its deadline.',
  DUPLICATE_PROJECT: 'A near-identical project with the same work type and contractor exists within 200 metres of this location.',
  PHOTO_REUSE: 'Official progress photographs appear identical to those uploaded for other unrelated projects.',
  SUSPICIOUS_CLUSTERING: 'The same contractor has been awarded 8+ projects in this constituency within the same fiscal year.',
  PAYMENT_SPIKE: 'A single large payment representing over 80% of total sanctions was released before physical verification.',
  CITIZEN_DISCREPANCY: 'Multiple independent citizen reports with GPS evidence contradict the official completion status.',
};

const RECOMMENDATIONS = {
  critical: 'Priority Field Verification Required — Recommend immediate on-site inspection by independent auditor.',
  high: 'Field Verification Recommended — District authority should conduct physical verification within 30 days.',
  medium: 'Enhanced Monitoring — Include in next quarterly review. Request updated progress photographs.',
  low: 'Routine Monitoring — No immediate action required.',
};

projects
  .filter(p => p.risk_score > 0)
  .forEach(project => {
    const factors = project.anomaly_flags.map(f => ({
      flag: f,
      explanation: FLAG_NARRATIVES[f] || 'Anomaly detected.',
    }));

    analyses.push({
      id: `ANAL-${String(analysisCounter++).padStart(4, '0')}`,
      project_id: project.id,
      risk_score: project.risk_score,
      risk_level: project.risk_level,
      anomaly_flags: project.anomaly_flags,
      contributing_factors: factors,
      narrative_text: `AI analysis of project ${project.id} (${project.title}) has identified ${project.anomaly_flags.length} risk indicator(s). ${factors.map(f => f.explanation).join(' ')} Based on these indicators, this project requires ${RECOMMENDATIONS[project.risk_level].toLowerCase()}`,
      recommendation: RECOMMENDATIONS[project.risk_level],
      model_version: 'sentinel-rules-v1.0',
      triggered_by: 'system',
      created_at: new Date().toISOString().split('T')[0],
    });
  });

// ─── Write Files ──────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects, null, 2));
fs.writeFileSync(path.join(dataDir, 'reports.json'), JSON.stringify(reports, null, 2));
fs.writeFileSync(path.join(dataDir, 'analyses.json'), JSON.stringify(analyses, null, 2));

console.log(`✅ Seed complete:`);
console.log(`   📁 projects.json  — ${projects.length} projects`);
console.log(`   📁 reports.json   — ${reports.length} citizen reports`);
console.log(`   📁 analyses.json  — ${analyses.length} AI analyses`);
console.log(`\n   Risk breakdown:`);
const byLevel = { low: 0, medium: 0, high: 0, critical: 0 };
projects.forEach(p => byLevel[p.risk_level]++);
Object.entries(byLevel).forEach(([l, c]) => console.log(`   ${l.padEnd(10)} ${c} projects`));
