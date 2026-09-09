/**
 * Phase 7 — Geospatial Intelligence & Location Verification Service
 * MPLAD-Sentinel (SIH26102)
 *
 * Core principles:
 * 1. Haversine distance computation returning meters and kilometers.
 * 2. Strict coordinate bounds validation (-90 to +90 lat, -180 to +180 lng).
 * 3. Proximity classification: VERY_CLOSE, CLOSE, NEARBY, FAR, FAR_FROM_PROJECT.
 * 4. Verification signal generation (NOT definitive fraud/genuineness proof).
 * 5. Ephemeral calculation (no permanent browser location persistence).
 */

export const GPS_VERIFICATION_DISCLAIMER =
  'GPS proximity is a verification signal and may be affected by location accuracy, device settings, or project coordinate quality.';

export const PROXIMITY_TIERS = {
  VERY_CLOSE: {
    code: 'VERY_CLOSE',
    label: 'Very Close',
    maxMeters: 100,
    message: 'Provided location is very close to the official project location.',
  },
  CLOSE: {
    code: 'CLOSE',
    label: 'Close',
    maxMeters: 500,
    message: 'Provided location is close to the official project location.',
  },
  NEARBY: {
    code: 'NEARBY',
    label: 'Nearby',
    maxMeters: 1000,
    message: 'Provided location is in the vicinity of the official project location.',
  },
  FAR: {
    code: 'FAR',
    label: 'Far',
    maxMeters: 5000,
    message: 'Provided location is distant from the official project location.',
  },
  FAR_FROM_PROJECT: {
    code: 'FAR_FROM_PROJECT',
    label: 'Far From Project',
    maxMeters: Infinity,
    message: 'Provided location is significantly far from the official project location.',
  },
};

/**
 * Validates coordinate pair against geographic constraints.
 * Latitude must be -90 to +90.
 * Longitude must be -180 to +180.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateCoordinates(latitude, longitude) {
  if (latitude === undefined || latitude === null || latitude === '') {
    return { valid: false, message: 'Latitude is required' };
  }
  if (longitude === undefined || longitude === null || longitude === '') {
    return { valid: false, message: 'Longitude is required' };
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || !isFinite(lat)) {
    return { valid: false, message: 'Latitude must be a valid number' };
  }
  if (isNaN(lon) || !isFinite(lon)) {
    return { valid: false, message: 'Longitude must be a valid number' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, message: 'Latitude must be between -90 and +90 degrees' };
  }
  if (lon < -180 || lon > 180) {
    return { valid: false, message: 'Longitude must be between -180 and +180 degrees' };
  }

  return { valid: true };
}

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 (in degrees)
 * @param {number} lon1 Longitude of point 1 (in degrees)
 * @param {number} lat2 Latitude of point 2 (in degrees)
 * @param {number} lon2 Longitude of point 2 (in degrees)
 * @returns {{ distanceMeters: number, distanceKm: number }}
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const val1 = validateCoordinates(lat1, lon1);
  if (!val1.valid) throw new Error(`Invalid coordinate 1: ${val1.message}`);

  const val2 = validateCoordinates(lat2, lon2);
  if (!val2.valid) throw new Error(`Invalid coordinate 2: ${val2.message}`);

  const R = 6371000; // Earth's mean radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const Δφ = toRad(Number(lat2) - Number(lat1));
  const Δλ = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = Math.round(R * c);
  const distanceKm = Number((distanceMeters / 1000).toFixed(3));

  return { distanceMeters, distanceKm };
}

/**
 * Classifies location proximity based on distance in meters.
 *
 * @param {number} distanceMeters
 * @returns {'VERY_CLOSE'|'CLOSE'|'NEARBY'|'FAR'|'FAR_FROM_PROJECT'}
 */
export function classifyLocationProximity(distanceMeters) {
  if (distanceMeters <= 100) return 'VERY_CLOSE';
  if (distanceMeters <= 500) return 'CLOSE';
  if (distanceMeters <= 1000) return 'NEARBY';
  if (distanceMeters <= 5000) return 'FAR';
  return 'FAR_FROM_PROJECT';
}

/**
 * Checks if a provided location is within a given threshold of the project location.
 *
 * @param {number} projectLat
 * @param {number} projectLon
 * @param {number} providedLat
 * @param {number} providedLon
 * @param {number} [thresholdMeters=500]
 * @returns {boolean}
 */
export function isLocationNearProject(
  projectLat,
  projectLon,
  providedLat,
  providedLon,
  thresholdMeters = 500
) {
  const { distanceMeters } = calculateDistance(projectLat, projectLon, providedLat, providedLon);
  return distanceMeters <= thresholdMeters;
}

/**
 * Verifies consistency between official project location and a provided location.
 * Formats standard location verification response.
 *
 * @param {Object} project Project document/object
 * @param {number|string} providedLat
 * @param {number|string} providedLon
 * @returns {Object} Structured verification response data
 */
export function verifyProjectLocationConsistency(project, providedLat, providedLon) {
  const coordVal = validateCoordinates(providedLat, providedLon);
  if (!coordVal.valid) {
    return {
      success: false,
      error: coordVal.message,
    };
  }

  const projCoordVal = validateCoordinates(project.latitude, project.longitude);
  if (!projCoordVal.valid) {
    return {
      success: false,
      error: `Project has invalid or missing official coordinates: ${projCoordVal.message}`,
      dataQualityWarning: true,
    };
  }

  const { distanceMeters, distanceKm } = calculateDistance(
    project.latitude,
    project.longitude,
    providedLat,
    providedLon
  );

  const locationStatus = classifyLocationProximity(distanceMeters);
  const tier = PROXIMITY_TIERS[locationStatus];

  return {
    success: true,
    data: {
      projectId: project.projectId,
      projectLocation: {
        latitude: Number(project.latitude),
        longitude: Number(project.longitude),
      },
      providedLocation: {
        latitude: Number(providedLat),
        longitude: Number(providedLon),
      },
      distanceMeters,
      distanceKm,
      locationStatus,
      message: tier.message,
      disclaimer: GPS_VERIFICATION_DISCLAIMER,
      // Future architecture hook for Phase 9 risk engine
      geoConsistencySignal: locationStatus,
    },
  };
}

/**
 * Checks project coordinates for data quality issues.
 * Returns warnings categorized as DATA QUALITY (not fraud).
 *
 * @param {Object} project
 * @returns {Array<{ code: string, message: string }>}
 */
export function evaluateCoordinateDataQuality(project) {
  const warnings = [];

  const hasLat = project.latitude !== undefined && project.latitude !== null && project.latitude !== '';
  const hasLon = project.longitude !== undefined && project.longitude !== null && project.longitude !== '';

  if (!hasLat && !hasLon) {
    warnings.push({
      code: 'MISSING_COORDINATES',
      message: 'Official project latitude and longitude are both missing.',
    });
    return warnings;
  }

  if (hasLat && !hasLon) {
    warnings.push({
      code: 'MISSING_LONGITUDE',
      message: 'Latitude is recorded but official longitude is missing.',
    });
  }

  if (!hasLat && hasLon) {
    warnings.push({
      code: 'MISSING_LATITUDE',
      message: 'Longitude is recorded but official latitude is missing.',
    });
  }

  if (hasLat) {
    const lat = Number(project.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      warnings.push({
        code: 'INVALID_LATITUDE',
        message: `Official latitude (${project.latitude}) is out of valid bounds [-90, +90].`,
      });
    }
  }

  if (hasLon) {
    const lon = Number(project.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      warnings.push({
        code: 'INVALID_LONGITUDE',
        message: `Official longitude (${project.longitude}) is out of valid bounds [-180, +180].`,
      });
    }
  }

  return warnings;
}
