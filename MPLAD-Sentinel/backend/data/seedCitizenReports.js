import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CitizenReport from '../models/CitizenReport.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://yaduvanshidevansh3336_db_user:3fPK5PqWTacbj7wy@cluster0.bd9aidy.mongodb.net';

const DEMO_REPORTS = [
  {
    reportId: 'REP-001',
    projectId: 'MPLAD-UP-001',
    category: 'Project Progress',
    description: 'Ground inspection completed. Road paving has completed the initial concrete layer.',
    latitude: 26.9857,
    longitude: 80.9325,
    gpsAccuracy: 14,
    submittedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    locationDistanceMeters: 15,
    locationDistanceKm: 0.015,
    locationStatus: 'VERY_CLOSE',
    locationSignal: 'Citizen-submitted location is consistent with the official project location.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&q=80',
    imageOriginalName: 'site_check_road.jpg',
    imageSimilarity: {
      similarityScore: 0.28,
      result: 'LOW_SIMILARITY',
      comparedAgainst: 'OFFICIAL_PHOTO',
      message: 'Image appears distinct from existing recorded photographs.',
    },
    verificationSignals: [
      {
        type: 'LOCATION_CONSISTENCY',
        severity: 'LOW',
        title: 'Location Consistent',
        message: 'Citizen location coordinates are consistent with the official project site.',
      },
      {
        type: 'CITIZEN_CONCERN',
        severity: 'INFO',
        title: 'Citizen Observation: Project Progress',
        message: 'Field observation submitted for administrative monitoring review.',
      },
    ],
    status: 'NEW',
  },
  {
    reportId: 'REP-002',
    projectId: 'MPLAD-UP-001',
    category: 'Work Quality',
    description: 'Drainage culvert alignment appears properly graded along the main avenue.',
    latitude: 26.9859,
    longitude: 80.9328,
    gpsAccuracy: 18,
    submittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    locationDistanceMeters: 52,
    locationDistanceKm: 0.052,
    locationStatus: 'VERY_CLOSE',
    locationSignal: 'Citizen-submitted location is consistent with the official project location.',
    imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80',
    imageOriginalName: 'drainage_culvert.jpg',
    imageSimilarity: {
      similarityScore: 0.94,
      result: 'HIGH_SIMILARITY',
      comparedAgainst: 'OFFICIAL_PHOTO',
      message: 'The submitted image appears highly similar to an existing official project photo. Manual review recommended.',
    },
    verificationSignals: [
      {
        type: 'LOCATION_CONSISTENCY',
        severity: 'LOW',
        title: 'Location Consistent',
        message: 'Citizen location coordinates are consistent with the official project site.',
      },
      {
        type: 'IMAGE_SIMILARITY',
        severity: 'MEDIUM',
        title: 'High Image Similarity Found',
        message: 'The submitted photo matches an existing image record. Manual verification recommended.',
      },
    ],
    status: 'NEW',
  },
  {
    reportId: 'REP-003',
    projectId: 'MPLAD-UP-001',
    category: 'Project Location',
    description: 'Notice board was seen near market square, approximately 6 kilometers south of the designated coordinates.',
    latitude: 26.9200,
    longitude: 80.9300,
    gpsAccuracy: 25,
    submittedAt: new Date(Date.now() - 12 * 3600 * 1000),
    locationDistanceMeters: 7300,
    locationDistanceKm: 7.3,
    locationStatus: 'FAR_FROM_PROJECT',
    locationSignal: 'Citizen-submitted location is significantly distant from the official project location and may require verification.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&q=80',
    imageOriginalName: 'market_sign.jpg',
    imageSimilarity: {
      similarityScore: 0.15,
      result: 'LOW_SIMILARITY',
      comparedAgainst: 'OFFICIAL_PHOTO',
      message: 'Image appears distinct from existing recorded photographs.',
    },
    verificationSignals: [
      {
        type: 'LOCATION_CONSISTENCY',
        severity: 'MEDIUM',
        title: 'Location Discrepancy Signal',
        message: 'Citizen location is 7.3 km away from official project coordinates. Manual verification recommended.',
      },
    ],
    status: 'NEW',
  },
  {
    reportId: 'REP-004',
    projectId: 'MPLAD-UP-007',
    category: 'Project Progress',
    description: 'Community Health Centre boundary wall has been erected, masonry work underway.',
    latitude: 26.8520,
    longitude: 80.9510,
    gpsAccuracy: 10,
    submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    locationDistanceMeters: 120,
    locationDistanceKm: 0.12,
    locationStatus: 'CLOSE',
    locationSignal: 'Citizen-submitted location is in the vicinity of the official project location.',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    imageOriginalName: 'chc_progress.jpg',
    imageSimilarity: {
      similarityScore: 0.35,
      result: 'LOW_SIMILARITY',
      comparedAgainst: 'OFFICIAL_PHOTO',
      message: 'Image appears distinct from existing recorded photographs.',
    },
    verificationSignals: [
      {
        type: 'LOCATION_CONSISTENCY',
        severity: 'LOW',
        title: 'Location Consistent',
        message: 'Citizen location coordinates are consistent with the official project site.',
      },
    ],
    status: 'NEW',
  },
];

async function seedReports() {
  await mongoose.connect(MONGO_URI);
  await CitizenReport.deleteMany({});
  await CitizenReport.insertMany(DEMO_REPORTS);
  console.log(`✅ Seeded ${DEMO_REPORTS.length} demonstration citizen reports.`);
  await mongoose.disconnect();
  process.exit(0);
}

seedReports().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
