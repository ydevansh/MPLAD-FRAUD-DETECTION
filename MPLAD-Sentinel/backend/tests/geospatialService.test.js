import assert from 'node:assert';
import {
  calculateDistance,
  validateCoordinates,
  classifyLocationProximity,
  isLocationNearProject,
  verifyProjectLocationConsistency,
  evaluateCoordinateDataQuality,
  GPS_VERIFICATION_DISCLAIMER,
} from '../services/geospatialService.js';

console.log('🧪 Running Geospatial Service Unit Tests...\n');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}:`, err.message);
    failed++;
  }
}

// 1. Same coordinates: distance ≈ 0
it('1. Same coordinates return distance ~0', () => {
  const res = calculateDistance(26.8467, 80.9462, 26.8467, 80.9462);
  assert.strictEqual(res.distanceMeters, 0);
  assert.strictEqual(res.distanceKm, 0);
});

// 2. Nearby coordinates: small distance (~45-50 meters)
it('2. Nearby coordinates return small distance', () => {
  const res = calculateDistance(26.8470, 80.9465, 26.8467, 80.9462);
  assert.ok(res.distanceMeters > 0 && res.distanceMeters < 100, `Expected 0-100m, got ${res.distanceMeters}m`);
  assert.strictEqual(typeof res.distanceKm, 'number');
});

// 3. Clearly separated coordinates (Lucknow to Kanpur ~75km)
it('3. Clearly separated coordinates return larger distance', () => {
  const res = calculateDistance(26.8467, 80.9462, 26.4499, 80.3319);
  assert.ok(res.distanceKm > 65 && res.distanceKm < 85, `Expected ~75km, got ${res.distanceKm}km`);
  assert.ok(res.distanceMeters > 65000);
});

// 4. Invalid latitude: rejected
it('4. Invalid latitude is rejected (> 90 or < -90)', () => {
  const res1 = validateCoordinates(95.5, 80.9462);
  assert.strictEqual(res1.valid, false);
  assert.match(res1.message, /Latitude must be between -90 and \+90/);

  const res2 = validateCoordinates(-91.0, 80.9462);
  assert.strictEqual(res2.valid, false);

  const res3 = validateCoordinates('not-a-num', 80.9462);
  assert.strictEqual(res3.valid, false);
});

// 5. Invalid longitude: rejected
it('5. Invalid longitude is rejected (> 180 or < -180)', () => {
  const res1 = validateCoordinates(26.8467, 185.0);
  assert.strictEqual(res1.valid, false);
  assert.match(res1.message, /Longitude must be between -180 and \+180/);

  const res2 = validateCoordinates(26.8467, -181.0);
  assert.strictEqual(res2.valid, false);
});

// 6. Missing coordinates handled gracefully
it('6. Missing coordinates handled gracefully', () => {
  assert.strictEqual(validateCoordinates(null, 80.9462).valid, false);
  assert.strictEqual(validateCoordinates(26.8467, undefined).valid, false);
  assert.strictEqual(validateCoordinates('', '').valid, false);
});

// 7-11. Location classifications
it('7. Location classification: VERY_CLOSE (<= 100m)', () => {
  assert.strictEqual(classifyLocationProximity(0), 'VERY_CLOSE');
  assert.strictEqual(classifyLocationProximity(45), 'VERY_CLOSE');
  assert.strictEqual(classifyLocationProximity(100), 'VERY_CLOSE');
});

it('8. Location classification: CLOSE (101m - 500m)', () => {
  assert.strictEqual(classifyLocationProximity(101), 'CLOSE');
  assert.strictEqual(classifyLocationProximity(320), 'CLOSE');
  assert.strictEqual(classifyLocationProximity(500), 'CLOSE');
});

it('9. Location classification: NEARBY (501m - 1000m)', () => {
  assert.strictEqual(classifyLocationProximity(501), 'NEARBY');
  assert.strictEqual(classifyLocationProximity(750), 'NEARBY');
  assert.strictEqual(classifyLocationProximity(1000), 'NEARBY');
});

it('10. Location classification: FAR (1001m - 5000m)', () => {
  assert.strictEqual(classifyLocationProximity(1001), 'FAR');
  assert.strictEqual(classifyLocationProximity(2800), 'FAR');
  assert.strictEqual(classifyLocationProximity(5000), 'FAR');
});

it('11. Location classification: FAR_FROM_PROJECT (> 5000m)', () => {
  assert.strictEqual(classifyLocationProximity(5001), 'FAR_FROM_PROJECT');
  assert.strictEqual(classifyLocationProximity(50000), 'FAR_FROM_PROJECT');
});

// 12. verifyProjectLocationConsistency structure & disclaimer
it('12. verifyProjectLocationConsistency formats exact specified response', () => {
  const project = {
    projectId: 'MPLAD-014',
    latitude: 26.8470,
    longitude: 80.9465,
  };

  const res = verifyProjectLocationConsistency(project, 26.8467, 80.9462);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.projectId, 'MPLAD-014');
  assert.strictEqual(res.data.projectLocation.latitude, 26.8470);
  assert.strictEqual(res.data.projectLocation.longitude, 80.9465);
  assert.strictEqual(res.data.providedLocation.latitude, 26.8467);
  assert.strictEqual(res.data.providedLocation.longitude, 80.9462);
  assert.ok(res.data.distanceMeters < 100);
  assert.strictEqual(res.data.locationStatus, 'VERY_CLOSE');
  assert.strictEqual(res.data.disclaimer, GPS_VERIFICATION_DISCLAIMER);
  assert.ok(res.data.message.includes('very close'));
});

// 13. Data Quality checks
it('13. evaluateCoordinateDataQuality identifies missing and invalid coordinates', () => {
  const missingBoth = evaluateCoordinateDataQuality({});
  assert.ok(missingBoth.some((w) => w.code === 'MISSING_COORDINATES'));

  const missingLon = evaluateCoordinateDataQuality({ latitude: 26.84 });
  assert.ok(missingLon.some((w) => w.code === 'MISSING_LONGITUDE'));

  const invalidLat = evaluateCoordinateDataQuality({ latitude: 120, longitude: 80 });
  assert.ok(invalidLat.some((w) => w.code === 'INVALID_LATITUDE'));
});

console.log(`\n=============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`=============================\n`);

if (failed > 0) {
  process.exit(1);
}
