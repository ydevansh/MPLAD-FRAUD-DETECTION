/**
 * MPLAD-Sentinel — Prototype Seed Data (Phase 3)
 * ⚠️  PROTOTYPE DATA ONLY — NOT REAL GOVERNMENT RECORDS
 * Representative demo projects designed to test and demonstrate Phase 3
 * Data, Financial, Progress, and Timeline Intelligence.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://yadu16104:nS2XnQ5FwN9N7YyS@cluster0.bd9aidy.mongodb.net/mplads?retryWrites=true&w=majority&appName=Cluster0';

const sampleImages = [
  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&q=80',
  'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80',
  'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
];

const projectsData = [
  // ── 1. NORMAL PROJECT: Expenditure aligned with Progress, On Track ─────────────
  {
    projectId: 'MPLAD-UP-001',
    name: 'Paved CC Road & Drainage Network at Bakshi Ka Talab',
    description: 'Construction of 1.2km durable cement concrete road with side storm drains to improve connectivity in suburban Lucknow.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'Road Construction',
    sanctionedAmount: 40.0,
    releasedAmount: 35.0,
    expenditure: 28.0,         // 70% expenditure
    physicalProgress: 72,       // 72% progress -> difference: -2% (ALIGNED)
    status: 'Ongoing',
    sanctionDate: new Date('2025-04-10'),
    startDate: new Date('2025-05-01'),
    expectedCompletionDate: new Date('2026-11-30'), // Future -> ON_TRACK
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Public Works Department (PWD) Division 2',
    address: 'BKT Sector 4, Lucknow, Uttar Pradesh',
    latitude: 26.9856,
    longitude: 80.9324,
    images: [sampleImages[0], sampleImages[1]],
    riskScore: 12,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 2. HIGH EXPENDITURE + LOW PROGRESS (Significant Gap) ──────────────────────
  {
    projectId: 'MPLAD-UP-002',
    name: 'Multi-Utility Community Welfare Hall at Gomti Nagar Extension',
    description: 'Establishment of 2-storey public community hall for civic gatherings, medical camps, and vocational training.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'Community Hall',
    sanctionedAmount: 75.0,
    releasedAmount: 45.0,
    expenditure: 65.0,         // 86.7% spent, spent > released (+20)
    physicalProgress: 25,       // 25% progress -> gap: 61.7% (+25)
    status: 'Delayed',
    sanctionDate: new Date('2024-06-15'),
    startDate: new Date('2024-07-10'),
    expectedCompletionDate: new Date('2025-05-15'), // Overdue by >30 days (+15)
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Lucknow Development Authority (LDA)',
    address: 'Sector 6, Gomti Nagar Extension, Lucknow',
    latitude: 26.8372,
    longitude: 81.0125,
    images: [sampleImages[1]],
    riskScore: 75,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 3. LOW EXPENDITURE + HIGH PROGRESS (Fast Execution / Frugal) ──────────────
  {
    projectId: 'MPLAD-UP-003',
    name: 'Deep Borewell Solar Drinking Water Plant at Mohanlalganj',
    description: 'Installation of high-capacity submersible water pumping station powered by rooftop solar array with 10,000L overhead reservoir.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Mohanlalganj',
    category: 'Water Supply',
    sanctionedAmount: 25.0,
    releasedAmount: 22.0,
    expenditure: 6.25,         // 25% expenditure
    physicalProgress: 80,       // 80% physical progress
    status: 'Ongoing',
    sanctionDate: new Date('2025-08-01'),
    startDate: new Date('2025-08-20'),
    expectedCompletionDate: new Date('2026-12-15'),
    actualCompletionDate: null,
    financialYear: '2025-26',
    implementingAgency: 'UP Jal Nigam Rural',
    address: 'Block Mohanlalganj, Lucknow',
    latitude: 26.6812,
    longitude: 80.9845,
    images: [sampleImages[2]],
    riskScore: 10,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 4. COMPLETED PROJECT: 100% Progress & Completed Date ─────────────────────
  {
    projectId: 'MPLAD-UP-004',
    name: 'Smart Classrooms and Science Laboratory at GIC Malihabad',
    description: 'Modernization of 6 classrooms with digital smart boards, solar backup power, and upgraded physics/chemistry laboratory facilities.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'School Renovation',
    sanctionedAmount: 30.0,
    releasedAmount: 30.0,
    expenditure: 29.4,         // 98%
    physicalProgress: 100,      // 100% completed
    status: 'Completed',
    sanctionDate: new Date('2024-01-10'),
    startDate: new Date('2024-02-01'),
    expectedCompletionDate: new Date('2024-11-30'),
    actualCompletionDate: new Date('2024-11-20'),
    financialYear: '2023-24',
    implementingAgency: 'UP Rajkiya Nirman Nigam (UPRNN)',
    address: 'Government Inter College Campus, Malihabad, Lucknow',
    latitude: 26.9214,
    longitude: 80.7125,
    images: [sampleImages[3], sampleImages[0]],
    riskScore: 5,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 5. DELAYED PROJECT: Overdue Deadline + Unfinished ─────────────────────────
  {
    projectId: 'MPLAD-UP-005',
    name: 'Primary Health Center Expansion & Diagnostic Wing at Kakori',
    description: 'Addition of emergency triage ward, pathology laboratory, and maternal care beds at Kakori Community Health Center.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'Health Center',
    sanctionedAmount: 45.0,
    releasedAmount: 38.0,
    expenditure: 32.0,         // 71% expenditure
    physicalProgress: 52,       // 52% progress, deadline passed
    status: 'Delayed',
    sanctionDate: new Date('2024-02-15'),
    startDate: new Date('2024-03-10'),
    expectedCompletionDate: new Date('2025-08-30'), // Past date (~7+ months overdue)
    actualCompletionDate: null,
    financialYear: '2023-24',
    implementingAgency: 'Chief Medical Officer Infrastructure Cell',
    address: 'Kakori Rural Health Campus, Lucknow',
    latitude: 26.8741,
    longitude: 80.7923,
    images: [sampleImages[1]],
    riskScore: 72,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 6. COMPARABLE DISTRICT OVER-COST OUTLIER (Same District & Category) ──────
  {
    projectId: 'MPLAD-UP-006',
    name: 'Asphalt Road Overhaul & Culvert Construction at Chinhat',
    description: 'Overhaul of connecting arterial road between Chinhat Industrial area and Faizabad Highway with concrete culverts.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'Road Construction',
    sanctionedAmount: 92.0,    // Substantially higher than UP-001 (40L) and UP-007 (36L)
    releasedAmount: 85.0,
    expenditure: 78.0,
    physicalProgress: 60,
    status: 'Ongoing',
    sanctionDate: new Date('2024-09-01'),
    startDate: new Date('2024-10-05'),
    expectedCompletionDate: new Date('2026-10-30'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'PWD Division 1',
    address: 'Chinhat Industrial Area Sector 2, Lucknow',
    latitude: 26.8791,
    longitude: 81.0254,
    images: [sampleImages[0]],
    riskScore: 65,
    riskLevel: 'Medium',
    isPrototypeData: true,
  },

  // ── 7. COMPARABLE BASELINE ROAD (Same District & Category) ────────────────────
  {
    projectId: 'MPLAD-UP-007',
    name: 'Village Link Road Construction at Sarojini Nagar',
    description: 'Paving 1.0 km rural link road connecting Sarojini Nagar cluster to State Highway 25.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Mohanlalganj',
    category: 'Road Construction',
    sanctionedAmount: 36.0,
    releasedAmount: 30.0,
    expenditure: 26.0,
    physicalProgress: 75,
    status: 'Ongoing',
    sanctionDate: new Date('2025-01-10'),
    startDate: new Date('2025-02-15'),
    expectedCompletionDate: new Date('2026-09-30'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Rural Engineering Services (RES)',
    address: 'Sarojini Nagar, Lucknow',
    latitude: 26.7512,
    longitude: 80.8654,
    images: [sampleImages[0]],
    riskScore: 18,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 8. DATA QUALITY WARNING CASE: Expenditure Exceeds Released Amount ─────────
  {
    projectId: 'MPLAD-UP-008',
    name: 'Solar High-Mast Streetlighting at Alambagh Junction',
    description: 'Installation of 8 solar high-mast illumination towers across heavy traffic crossroads in Alambagh.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'Solar Lights',
    sanctionedAmount: 28.0,
    releasedAmount: 18.0,      // Only 18L released
    expenditure: 23.5,         // Expended 23.5L (> released! Triggers Data Quality Warning)
    physicalProgress: 68,
    status: 'Ongoing',
    sanctionDate: new Date('2024-11-05'),
    startDate: new Date('2024-12-01'),
    expectedCompletionDate: new Date('2026-08-31'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'UP Non-Conventional Energy Development Agency (UPNEDA)',
    address: 'Alambagh Intersection, Lucknow',
    latitude: 26.8124,
    longitude: 80.9082,
    images: [sampleImages[2]],
    riskScore: 45,
    riskLevel: 'Medium',
    isPrototypeData: true,
  },

  // ── 9. VARANASI: Water Supply Baseline 1 ──────────────────────────────────────
  {
    projectId: 'MPLAD-UP-009',
    name: 'Piped Drinking Water Overhead Tank at Rohania',
    description: 'Construction of 50,000L RCC overhead water tank with distribution pipes covering 4 villages.',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi',
    category: 'Water Supply',
    sanctionedAmount: 22.0,
    releasedAmount: 20.0,
    expenditure: 14.5,
    physicalProgress: 65,
    status: 'Ongoing',
    sanctionDate: new Date('2025-02-10'),
    startDate: new Date('2025-03-01'),
    expectedCompletionDate: new Date('2026-11-15'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'UP Jal Nigam',
    address: 'Rohania Block, Varanasi, Uttar Pradesh',
    latitude: 25.2685,
    longitude: 82.9372,
    images: [sampleImages[2]],
    riskScore: 15,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 10. VARANASI: Water Supply Baseline 2 ─────────────────────────────────────
  {
    projectId: 'MPLAD-UP-010',
    name: 'Arsenic-Removal RO Water Filtration Plant at Sevapuri',
    description: 'Community drinking water purification facility providing safe potable water to 800 households.',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi',
    category: 'Water Supply',
    sanctionedAmount: 20.0,
    releasedAmount: 18.0,
    expenditure: 17.0,
    physicalProgress: 88,
    status: 'Ongoing',
    sanctionDate: new Date('2024-10-12'),
    startDate: new Date('2024-11-01'),
    expectedCompletionDate: new Date('2026-05-15'), // Due soon
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'UP Jal Nigam',
    address: 'Sevapuri, Varanasi, Uttar Pradesh',
    latitude: 25.3245,
    longitude: 82.7891,
    images: [sampleImages[2]],
    riskScore: 12,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 11. RAJASTHAN: JAIPUR - Normal Completed Road ─────────────────────────────
  {
    projectId: 'MPLAD-RJ-001',
    name: 'Bituminous Road from Sanganer to Muhana Mandi',
    description: 'Upgradation and asphalt carpeting of 2.4 km road easing farmer market transport.',
    state: 'Rajasthan',
    district: 'Jaipur',
    constituency: 'Jaipur Rural',
    category: 'Road Construction',
    sanctionedAmount: 55.0,
    releasedAmount: 55.0,
    expenditure: 53.8,
    physicalProgress: 100,
    status: 'Completed',
    sanctionDate: new Date('2024-03-01'),
    startDate: new Date('2024-04-10'),
    expectedCompletionDate: new Date('2025-02-28'),
    actualCompletionDate: new Date('2025-02-15'),
    financialYear: '2023-24',
    implementingAgency: 'Rajasthan PWD',
    address: 'Muhana Road, Sanganer, Jaipur',
    latitude: 26.8124,
    longitude: 75.7689,
    images: [sampleImages[0]],
    riskScore: 8,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 12. RAJASTHAN: JAIPUR - High Spend Low Progress (Gap) ────────────────────
  {
    projectId: 'MPLAD-RJ-002',
    name: 'Rainwater Harvesting & Lake Restoration at Amer Kund',
    description: 'Desilting historic check dams, bund strengthening, and constructing rainwater recharge percolation wells.',
    state: 'Rajasthan',
    district: 'Jaipur',
    constituency: 'Jaipur',
    category: 'Pond Renovation',
    sanctionedAmount: 65.0,
    releasedAmount: 60.0,
    expenditure: 55.0,         // 85% spent
    physicalProgress: 30,       // 30% progress -> Gap: 55%
    status: 'Ongoing',
    sanctionDate: new Date('2024-05-20'),
    startDate: new Date('2024-06-15'),
    expectedCompletionDate: new Date('2026-10-31'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Jaipur Municipal Corporation Heritage',
    address: 'Amer Foothills, Jaipur',
    latitude: 26.9855,
    longitude: 75.8512,
    images: [sampleImages[1]],
    riskScore: 82,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 13. RAJASTHAN: JAIPUR - Delayed Solar Facility ────────────────────────────
  {
    projectId: 'MPLAD-RJ-003',
    name: 'Solar Powered Cold Storage for Farmers at Bassi',
    description: 'Small-scale 50 MT cold preservation unit for vegetable growers powered by 25kW off-grid solar installation.',
    state: 'Rajasthan',
    district: 'Jaipur',
    constituency: 'Dausa',
    category: 'Solar Lights',
    sanctionedAmount: 38.0,
    releasedAmount: 32.0,
    expenditure: 28.0,
    physicalProgress: 45,
    status: 'Delayed',
    sanctionDate: new Date('2024-02-10'),
    startDate: new Date('2024-03-01'),
    expectedCompletionDate: new Date('2025-06-30'), // Overdue
    actualCompletionDate: null,
    financialYear: '2023-24',
    implementingAgency: 'Rajasthan Renewable Energy Corporation (RRECL)',
    address: 'Bassi Agriculture Market Yard, Jaipur',
    latitude: 26.8341,
    longitude: 76.0423,
    images: [sampleImages[2]],
    riskScore: 68,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 14. MADHYA PRADESH: BHOPAL - Normal Health Center ─────────────────────────
  {
    projectId: 'MPLAD-MP-001',
    name: 'Ayush Wellness Center & Medicine Dispensary at Kolar Road',
    description: 'Construction of primary herbal therapy and outpatient consultation building with pathology collection booth.',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    constituency: 'Bhopal',
    category: 'Health Center',
    sanctionedAmount: 42.0,
    releasedAmount: 38.0,
    expenditure: 32.0,         // 76% spent
    physicalProgress: 78,       // 78% progress (ALIGNED)
    status: 'Ongoing',
    sanctionDate: new Date('2025-01-15'),
    startDate: new Date('2025-02-10'),
    expectedCompletionDate: new Date('2026-11-20'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'MP Health Infrastructure Development Corp',
    address: 'Kolar Road Sector C, Bhopal',
    latitude: 23.1845,
    longitude: 77.4215,
    images: [sampleImages[3]],
    riskScore: 14,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 15. MADHYA PRADESH: BHOPAL - Drainage Gap Case ───────────────────────────
  {
    projectId: 'MPLAD-MP-002',
    name: 'Underground Sewerage & Stormwater Pipeline at Berasia',
    description: 'Reinforced concrete culvert drainage system to mitigate monsoon flooding across Berasia town center.',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    constituency: 'Bhopal',
    category: 'Drainage',
    sanctionedAmount: 60.0,
    releasedAmount: 54.0,
    expenditure: 51.0,         // 85% spent
    physicalProgress: 38,       // 38% progress -> Gap: 47%
    status: 'Ongoing',
    sanctionDate: new Date('2024-07-05'),
    startDate: new Date('2024-08-01'),
    expectedCompletionDate: new Date('2026-09-30'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Bhopal Municipal Corporation',
    address: 'Berasia Main Bazaar, Bhopal',
    latitude: 23.6341,
    longitude: 77.4328,
    images: [sampleImages[1]],
    riskScore: 76,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 16. MADHYA PRADESH: INDORE - Completed Sports Ground ─────────────────────
  {
    projectId: 'MPLAD-MP-003',
    name: 'Youth Sports Complex & Athletic Running Track at Rau',
    description: 'Synthetic 400m running track, open gymnasium, and fenced multi-sport turf for local school youth.',
    state: 'Madhya Pradesh',
    district: 'Indore',
    constituency: 'Indore',
    category: 'Sports Facility',
    sanctionedAmount: 48.0,
    releasedAmount: 48.0,
    expenditure: 46.5,
    physicalProgress: 100,
    status: 'Completed',
    sanctionDate: new Date('2024-01-20'),
    startDate: new Date('2024-02-15'),
    expectedCompletionDate: new Date('2024-12-31'),
    actualCompletionDate: new Date('2024-12-18'),
    financialYear: '2023-24',
    implementingAgency: 'Indore Development Authority (IDA)',
    address: 'Rau Sports Enclave, Indore',
    latitude: 22.6341,
    longitude: 75.8012,
    images: [sampleImages[0]],
    riskScore: 6,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 17. BIHAR: PATNA - Delayed Drainage Overdue by 150 Days ──────────────────
  {
    projectId: 'MPLAD-BR-001',
    name: 'Covered Drainage Trunk Line at Danapur Cantonment Fringe',
    description: 'Construction of deep RCC box drain to eliminate roadside water stagnation along Danapur station approach.',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Pataliputra',
    category: 'Drainage',
    sanctionedAmount: 52.0,
    releasedAmount: 42.0,
    expenditure: 38.0,
    physicalProgress: 48,
    status: 'Delayed',
    sanctionDate: new Date('2024-04-12'),
    startDate: new Date('2024-05-10'),
    expectedCompletionDate: new Date('2025-05-15'), // Overdue
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Bihar Urban Infrastructure Development Corp (BUIDCO)',
    address: 'Danapur Cantonment Road, Patna',
    latitude: 25.6214,
    longitude: 85.0451,
    images: [sampleImages[1]],
    riskScore: 74,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 18. BIHAR: PATNA - Normal High Progress Solar Plant ──────────────────────
  {
    projectId: 'MPLAD-BR-002',
    name: 'Rooftop Solar Electrification at Phulwari Sharif High School',
    description: '15 kW grid-tied solar photovoltaic array with hybrid inverters powering school computer lab and fans.',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Patna Sahib',
    category: 'Solar Lights',
    sanctionedAmount: 18.0,
    releasedAmount: 16.0,
    expenditure: 14.0,         // 78% spent
    physicalProgress: 82,       // 82% progress (ALIGNED)
    status: 'Ongoing',
    sanctionDate: new Date('2025-03-01'),
    startDate: new Date('2025-03-25'),
    expectedCompletionDate: new Date('2026-10-15'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Bihar Renewable Energy Development Agency (BREDA)',
    address: 'Phulwari Sharif, Patna',
    latitude: 25.5789,
    longitude: 85.0812,
    images: [sampleImages[2]],
    riskScore: 11,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 19. BIHAR: PATNA - Severe Gap Project (88% Spent, 22% Physical) ──────────
  {
    projectId: 'MPLAD-BR-003',
    name: 'Panchayat Bhavan & Digital Seva Kendra at Fatuha',
    description: 'Civic administrative center with digital service kiosks for rural e-governance and citizen grievances.',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Patna Sahib',
    category: 'Community Hall',
    sanctionedAmount: 95.0,
    releasedAmount: 65.0,
    expenditure: 82.0,         // 86.3% spent, spent > released (+20)
    physicalProgress: 15,       // 15% progress -> Gap: 71.3% (+25)
    status: 'Delayed',
    sanctionDate: new Date('2024-05-15'),
    startDate: new Date('2024-06-01'),
    expectedCompletionDate: new Date('2025-02-28'), // Overdue by >30 days (+15)
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Panchayati Raj Engineering Wing',
    address: 'Fatuha Block, Patna',
    latitude: 25.5124,
    longitude: 85.3125,
    images: [sampleImages[1]],
    riskScore: 90,
    riskLevel: 'Critical',
    isPrototypeData: true,
  },

  // ── 19B. BIHAR: PATNA - Similar Project Duplicate to Fatuha ────────────────
  {
    projectId: 'MPLAD-BR-004',
    name: 'Panchayat Bhavan & Digital Seva Kendra at Fatuha Block Wing',
    description: 'Civic administrative center and digital service kiosks for rural e-governance at Fatuha Block.',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Patna Sahib',
    category: 'Community Hall',
    sanctionedAmount: 35.0,
    releasedAmount: 30.0,
    expenditure: 24.0,
    physicalProgress: 65,
    status: 'Ongoing',
    sanctionDate: new Date('2024-07-10'),
    startDate: new Date('2024-08-01'),
    expectedCompletionDate: new Date('2026-06-30'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Panchayati Raj Engineering Wing',
    address: 'Fatuha Block Wing, Patna',
    latitude: 25.5130,
    longitude: 85.3135,
    images: [sampleImages[1]],
    riskScore: 25,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 20. MAHARASHTRA: PUNE - Completed School Renovation ──────────────────────
  {
    projectId: 'MPLAD-MH-001',
    name: 'Modern Science & Robotics Center at Hadapsar PMC School',
    description: 'Modernization of science laboratories, computer stations, and safety infrastructure across municipal school.',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Shirur',
    category: 'School Renovation',
    sanctionedAmount: 32.0,
    releasedAmount: 32.0,
    expenditure: 31.2,
    physicalProgress: 100,
    status: 'Completed',
    sanctionDate: new Date('2024-02-10'),
    startDate: new Date('2024-03-01'),
    expectedCompletionDate: new Date('2024-11-30'),
    actualCompletionDate: new Date('2024-11-15'),
    financialYear: '2023-24',
    implementingAgency: 'Pune Municipal Corporation (PMC)',
    address: 'Hadapsar Ward 18, Pune',
    latitude: 18.5024,
    longitude: 73.9281,
    images: [sampleImages[3]],
    riskScore: 5,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 21. MAHARASHTRA: PUNE - Road Project with Unspent Funds ──────────────────
  {
    projectId: 'MPLAD-MH-002',
    name: 'Concrete Pavement of Rural Connecting Road at Haveli',
    description: 'Paving 1.8km stretch to enhance freight movement from local agro markets to Pune-Solapur highway.',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Baramati',
    category: 'Road Construction',
    sanctionedAmount: 50.0,
    releasedAmount: 45.0,
    expenditure: 15.0,         // 30% spent (unspent released = 30L)
    physicalProgress: 42,
    status: 'Ongoing',
    sanctionDate: new Date('2025-05-10'),
    startDate: new Date('2025-06-01'),
    expectedCompletionDate: new Date('2026-12-31'),
    actualCompletionDate: null,
    financialYear: '2025-26',
    implementingAgency: 'Maharashtra PWD Executive Division',
    address: 'Haveli Taluka, Pune',
    latitude: 18.4521,
    longitude: 73.9854,
    images: [sampleImages[0]],
    riskScore: 16,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 22. MAHARASHTRA: PUNE - High Cost Outlier Community Hall ─────────────────
  {
    projectId: 'MPLAD-MH-003',
    name: 'Senior Citizen Recreation Hall & Library at Kothrud',
    description: 'Civic senior welfare facility featuring reading room, physiotherapy center, and solar water heating system.',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Pune',
    category: 'Community Hall',
    sanctionedAmount: 85.0,    // High benchmark compared to typical 35-45L
    releasedAmount: 75.0,
    expenditure: 70.0,
    physicalProgress: 55,
    status: 'Ongoing',
    sanctionDate: new Date('2024-09-15'),
    startDate: new Date('2024-10-15'),
    expectedCompletionDate: new Date('2026-09-30'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'PMC Building Dept',
    address: 'Kothrud Ward 12, Pune',
    latitude: 18.5074,
    longitude: 73.8077,
    images: [sampleImages[1]],
    riskScore: 58,
    riskLevel: 'Medium',
    isPrototypeData: true,
  },

  // ── 23. MAHARASHTRA: PUNE - Baseline Community Hall for Comparison ───────────
  {
    projectId: 'MPLAD-MH-004',
    name: 'Women Self-Help Group Skill Center at Ambegaon',
    description: 'Single-storey community training center for handicrafts and tailoring cooperatives.',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Baramati',
    category: 'Community Hall',
    sanctionedAmount: 38.0,
    releasedAmount: 35.0,
    expenditure: 28.0,
    physicalProgress: 76,
    status: 'Ongoing',
    sanctionDate: new Date('2025-02-01'),
    startDate: new Date('2025-02-25'),
    expectedCompletionDate: new Date('2026-11-30'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Zilla Parishad Pune',
    address: 'Ambegaon Taluka, Pune',
    latitude: 18.4325,
    longitude: 73.8412,
    images: [sampleImages[1]],
    riskScore: 12,
    riskLevel: 'Low',
    isPrototypeData: true,
  },

  // ── 24. UTTAR PRADESH: AGRA - Delayed Drainage Project ────────────────────────
  {
    projectId: 'MPLAD-UP-011',
    name: 'Civil Lines Heritage Storm Drain Rehabilitation at Agra',
    description: 'Reconstruction of masonry drains to resolve monsoon waterlogging around tourist approach roads in Agra.',
    state: 'Uttar Pradesh',
    district: 'Agra',
    constituency: 'Agra',
    category: 'Drainage',
    sanctionedAmount: 70.0,
    releasedAmount: 62.0,
    expenditure: 55.0,
    physicalProgress: 50,
    status: 'Delayed',
    sanctionDate: new Date('2024-01-15'),
    startDate: new Date('2024-02-10'),
    expectedCompletionDate: new Date('2025-04-30'), // Overdue by ~11 months
    actualCompletionDate: null,
    financialYear: '2023-24',
    implementingAgency: 'Agra Nagar Nigam',
    address: 'Civil Lines, Agra, Uttar Pradesh',
    latitude: 27.1951,
    longitude: 78.0024,
    images: [sampleImages[1]],
    riskScore: 75,
    riskLevel: 'High',
    isPrototypeData: true,
  },

  // ── 25. SIMILAR PROJECT DUPLICATE SIGNAL DEMO ─────────────────────────────
  {
    projectId: 'MPLAD-UP-012',
    name: 'Paved CC Road & Drainage Network at Bakshi Ka Talab Sector 4',
    description: 'Construction of 1.2km durable cement concrete road and side drainage network at Bakshi Ka Talab Sector 4.',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    constituency: 'Lucknow',
    category: 'Road Construction',
    sanctionedAmount: 42.0,
    releasedAmount: 38.0,
    expenditure: 32.0,
    physicalProgress: 75,
    status: 'Ongoing',
    sanctionDate: new Date('2025-05-15'),
    startDate: new Date('2025-06-01'),
    expectedCompletionDate: new Date('2026-12-31'),
    actualCompletionDate: null,
    financialYear: '2024-25',
    implementingAgency: 'Public Works Department (PWD) Division 2',
    address: 'BKT Sector 4, Lucknow, Uttar Pradesh',
    latitude: 26.9860,
    longitude: 80.9330,
    images: [sampleImages[0]],
    riskScore: 25,
    riskLevel: 'Low',
    isPrototypeData: true,
  },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing projects collection...');
    await Project.deleteMany({});

    console.log(`Seeding ${projectsData.length} Phase 3 projects with financial & timeline metrics...`);
    const inserted = await Project.insertMany(projectsData);
    console.log(`✅ Successfully seeded ${inserted.length} projects!`);

    console.log('\n--- Scenario Distribution ---');
    console.log('• Normal (Aligned): MPLAD-UP-001, MPLAD-MP-001, MPLAD-BR-002, etc.');
    console.log('• Significant Gap: MPLAD-UP-002 (90% spent, 35% progress), MPLAD-BR-003 (88% spent, 22% progress)');
    console.log('• Low Spend High Progress: MPLAD-UP-003 (25% spent, 80% progress)');
    console.log('• Completed: MPLAD-UP-004, MPLAD-RJ-001, MPLAD-MP-003, MPLAD-MH-001');
    console.log('• Delayed: MPLAD-UP-005, MPLAD-RJ-003, MPLAD-BR-001, MPLAD-UP-011');
    console.log('• Data Quality Warning: MPLAD-UP-008 (spent 23.5L > released 18L)');
    console.log('• District Comparable Outlier: MPLAD-UP-006 (Road in Lucknow 92L vs ~38L avg)');

    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
