import CitizenReport from '../models/CitizenReport.js';
import {
  calculateDistance,
  classifyLocationProximity,
  validateCoordinates,
  GPS_VERIFICATION_DISCLAIMER,
} from './geospatialService.js';

/**
 * Phase 8/9 — Citizen Verification Service
 * Coordinates ground evidence processing, location verification signals, and evidence aggregation.
 */

/**
 * Generates next sequential Report ID (e.g. REP-001, REP-002).
 */
export async function generateReportId() {
  const count = await CitizenReport.countDocuments();
  const nextNum = count + 1;
  return `REP-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Evaluates citizen coordinates against official project coordinates.
 * Returns distance, proximity status, and neutral verification signal text.
 *
 * @param {Object} project
 * @param {number|string} citizenLat
 * @param {number|string} citizenLng
 * @param {number} [gpsAccuracy]
 * @returns {Object}
 */
export function evaluateCitizenLocation(project, citizenLat, citizenLng, gpsAccuracy) {
  if (
    citizenLat === undefined ||
    citizenLng === undefined ||
    citizenLat === null ||
    citizenLng === null ||
    citizenLat === '' ||
    citizenLng === ''
  ) {
    return {
      distanceMeters: null,
      distanceKm: null,
      locationStatus: 'UNKNOWN',
      locationSignal: 'GPS location was not provided with this report.',
    };
  }

  const citVal = validateCoordinates(citizenLat, citizenLng);
  const projVal = validateCoordinates(project.latitude, project.longitude);

  if (!citVal.valid || !projVal.valid) {
    return {
      distanceMeters: null,
      distanceKm: null,
      locationStatus: 'UNKNOWN',
      locationSignal: 'Coordinate data could not be validated for proximity checking.',
    };
  }

  const { distanceMeters, distanceKm } = calculateDistance(
    project.latitude,
    project.longitude,
    citizenLat,
    citizenLng
  );

  const locationStatus = classifyLocationProximity(distanceMeters);

  let locationSignal = '';
  if (locationStatus === 'VERY_CLOSE') {
    locationSignal = 'Citizen-submitted location is consistent with the official project location.';
  } else if (locationStatus === 'CLOSE' || locationStatus === 'NEARBY') {
    locationSignal = 'Citizen-submitted location is in the vicinity of the official project location.';
  } else {
    locationSignal = 'Citizen-submitted location is significantly distant from the official project location and may require verification.';
  }

  if (gpsAccuracy && Number(gpsAccuracy) > 50) {
    locationSignal += ` (GPS accuracy is ±${Math.round(gpsAccuracy)}m; interpret location signal cautiously).`;
  }

  return {
    distanceMeters,
    distanceKm,
    locationStatus,
    locationSignal,
  };
}

/**
 * Assembles structured verification signals for the report.
 *
 * @param {Object} params
 * @returns {Array<Object>}
 */
export function assembleVerificationSignals({
  locationStatus,
  locationDistanceMeters,
  gpsAccuracy,
  imageSimilarity,
  category,
}) {
  const signals = [];

  // 1. Location Consistency Signal
  if (locationStatus === 'VERY_CLOSE' || locationStatus === 'CLOSE') {
    signals.push({
      type: 'LOCATION_CONSISTENCY',
      severity: 'LOW',
      title: 'Location Consistent',
      message: 'Citizen location coordinates are consistent with the official project site.',
    });
  } else if (locationStatus === 'FAR' || locationStatus === 'FAR_FROM_PROJECT') {
    signals.push({
      type: 'LOCATION_CONSISTENCY',
      severity: 'MEDIUM',
      title: 'Location Discrepancy Signal',
      message: `Citizen location is ${locationDistanceMeters >= 1000 ? (locationDistanceMeters / 1000).toFixed(1) + ' km' : locationDistanceMeters + ' m'} away from official project coordinates. Manual verification recommended.`,
    });
  }

  // 2. GPS Accuracy Advisory
  if (gpsAccuracy && Number(gpsAccuracy) > 50) {
    signals.push({
      type: 'GPS_ACCURACY',
      severity: 'INFO',
      title: 'GPS Accuracy Notice',
      message: `Device reported accuracy of ±${Math.round(gpsAccuracy)} meters. Proximity should be interpreted as approximate.`,
    });
  }

  // 3. Image Similarity Signal
  if (imageSimilarity && imageSimilarity.result === 'HIGH_SIMILARITY') {
    signals.push({
      type: 'IMAGE_SIMILARITY',
      severity: 'MEDIUM',
      title: 'High Image Similarity Found',
      message: imageSimilarity.message || 'The submitted photo matches an existing image record. Manual verification recommended.',
    });
  }

  // 4. Specific Citizen Concern Category
  if (category === 'Project Not Found' || category === 'Work Quality' || category === 'Project Progress') {
    signals.push({
      type: 'CITIZEN_CONCERN',
      severity: 'INFO',
      title: `Citizen Observation: ${category}`,
      message: 'Field observation submitted for administrative monitoring review.',
    });
  }

  return signals;
}

/**
 * Computes aggregated verification summary for a project's evidence dashboard.
 *
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export async function getProjectEvidenceSummary(projectId) {
  const reports = await CitizenReport.find({ projectId }).sort({ submittedAt: -1 }).lean();

  const reportCount = reports.length;
  let consistentCount = 0;
  let distantCount = 0;
  let unknownCount = 0;

  let highSimilarityCount = 0;
  let moderateSimilarityCount = 0;
  let lowSimilarityCount = 0;
  let photoCount = 0;
  let gpsCount = 0;

  reports.forEach((rep) => {
    if (rep.imageUrl) photoCount++;
    if (rep.latitude != null && rep.longitude != null) gpsCount++;

    if (rep.locationStatus === 'VERY_CLOSE' || rep.locationStatus === 'CLOSE' || rep.locationStatus === 'NEARBY') {
      consistentCount++;
    } else if (rep.locationStatus === 'FAR' || rep.locationStatus === 'FAR_FROM_PROJECT') {
      distantCount++;
    } else {
      unknownCount++;
    }

    const simResult = rep.imageSimilarity?.result;
    if (simResult === 'HIGH_SIMILARITY') highSimilarityCount++;
    else if (simResult === 'MODERATE_SIMILARITY') moderateSimilarityCount++;
    else if (simResult === 'LOW_SIMILARITY') lowSimilarityCount++;
  });

  return {
    projectId,
    reportCount,
    photoCount,
    gpsCount,
    locationSignals: {
      consistent: consistentCount,
      distant: distantCount,
      unknown: unknownCount,
    },
    imageSignals: {
      highSimilarity: highSimilarityCount,
      moderateSimilarity: moderateSimilarityCount,
      lowSimilarity: lowSimilarityCount,
    },
    status: reportCount > 0 ? 'Citizen evidence available for authority review.' : 'No citizen verification reports submitted yet.',
    disclaimer: GPS_VERIFICATION_DISCLAIMER,
    // Prepared signal structure for future Phase 10 risk engine integration
    citizenEvidenceSignal: {
      reportCount,
      locationConsistency: distantCount > 0 && consistentCount > 0 ? 'MIXED' : distantCount > 0 ? 'DISTANT' : consistentCount > 0 ? 'CONSISTENT' : 'UNKNOWN',
      imageSimilaritySignals: highSimilarityCount,
      evidenceAvailable: reportCount > 0,
    },
  };
}
