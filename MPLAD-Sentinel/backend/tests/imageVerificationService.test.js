import assert from 'node:assert';
import sharp from 'sharp';
import {
  computeImageHash,
  compareHashes,
  classifySimilarity,
  compareCitizenImageWithExisting,
} from '../services/imageVerificationService.js';

console.log('🧪 Running Image Verification Service Unit Tests...\n');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res
        .then(() => {
          console.log(`  ✓ ${desc}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ✗ ${desc}:`, err.message);
          failed++;
        });
    }
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}:`, err.message);
    failed++;
  }
}

async function runTests() {
  // Create two sample synthetic image buffers with Sharp:
  // 1. Solid red image
  const imgA = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toBuffer();

  // 2. Grayscale gradient / checkered image
  const imgB = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 0, g: 255, b: 255 },
    },
  })
    .jpeg()
    .toBuffer();

  await it('1. computeImageHash produces 64-bit binary hash for valid buffer', async () => {
    const hash = await computeImageHash(imgA);
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[01]{64}$/);
  });

  await it('2. Same image hash comparison produces similarity = 1.0 (HIGH_SIMILARITY)', async () => {
    const hash1 = await computeImageHash(imgA);
    const hash2 = await computeImageHash(imgA);
    const sim = compareHashes(hash1, hash2);
    assert.strictEqual(sim, 1);
    assert.strictEqual(classifySimilarity(sim), 'HIGH_SIMILARITY');
  });

  await it('3. Threshold classifications work as specified', () => {
    assert.strictEqual(classifySimilarity(0.95), 'HIGH_SIMILARITY');
    assert.strictEqual(classifySimilarity(0.85), 'HIGH_SIMILARITY');
    assert.strictEqual(classifySimilarity(0.80), 'MODERATE_SIMILARITY');
    assert.strictEqual(classifySimilarity(0.65), 'MODERATE_SIMILARITY');
    assert.strictEqual(classifySimilarity(0.64), 'LOW_SIMILARITY');
    assert.strictEqual(classifySimilarity(0.10), 'LOW_SIMILARITY');
  });

  await it('4. Invalid/corrupt input handled gracefully without crashing', async () => {
    const badHash = await computeImageHash(Buffer.from('not an image'));
    assert.strictEqual(badHash, null);

    const nonExistent = await computeImageHash('/tmp/non_existent_file_xyz123.jpg');
    assert.strictEqual(nonExistent, null);
  });

  console.log(`\n=============================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`=============================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
