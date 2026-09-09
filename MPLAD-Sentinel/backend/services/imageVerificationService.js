import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Phase 9 — Basic Image Verification Service
 * MPLAD-Sentinel (SIH26102)
 *
 * Lightweight perceptual difference hash (dHash) implementation.
 * Compares citizen-submitted photo against official project photos and previous reports.
 *
 * Principles:
 * - Similarity is a monitoring signal, NOT proof of fraud or photo recycling.
 * - Categorizes similarity: HIGH (>= 0.85), MODERATE (0.65 - 0.84), LOW (< 0.65).
 * - Never throws or crashes the server if remote fetching or decoding fails.
 */

export const SIMILARITY_THRESHOLDS = {
  HIGH: 0.85,
  MODERATE: 0.65,
};

/**
 * Computes a 64-bit difference hash (dHash) of an image buffer or file path.
 * Resizes image to 9x8 grayscale, then compares adjacent pixels.
 *
 * @param {string|Buffer} input Local file path, URL, or Buffer
 * @returns {Promise<string|null>} 64-character binary hash string or null if failed
 */
export async function computeImageHash(input) {
  try {
    let imageBuffer;

    if (Buffer.isBuffer(input)) {
      imageBuffer = input;
    } else if (typeof input === 'string') {
      if (input.startsWith('http://') || input.startsWith('https://')) {
        // Fetch remote image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        try {
          const res = await fetch(input, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) return null;
          const arrayBuf = await res.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuf);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          return null;
        }
      } else if (fs.existsSync(input)) {
        imageBuffer = fs.readFileSync(input);
      } else {
        return null;
      }
    } else {
      return null;
    }

    // Resize to 9 width x 8 height, single-channel grayscale
    const rawPixels = await sharp(imageBuffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // Compute 64-bit difference hash
    let hash = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = rawPixels[y * 9 + x];
        const right = rawPixels[y * 9 + (x + 1)];
        hash += left > right ? '1' : '0';
      }
    }

    return hash;
  } catch (err) {
    console.warn('[imageVerification:computeHash]', err.message);
    return null;
  }
}

/**
 * Calculates similarity score (0.0 to 1.0) between two binary hashes.
 *
 * @param {string} hash1
 * @param {string} hash2
 * @returns {number}
 */
export function compareHashes(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 0;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }

  const similarity = 1 - distance / hash1.length;
  return Number(similarity.toFixed(3));
}

/**
 * Classifies numerical similarity into prototype categories.
 *
 * @param {number} score
 * @returns {'HIGH_SIMILARITY'|'MODERATE_SIMILARITY'|'LOW_SIMILARITY'}
 */
export function classifySimilarity(score) {
  if (score >= SIMILARITY_THRESHOLDS.HIGH) return 'HIGH_SIMILARITY';
  if (score >= SIMILARITY_THRESHOLDS.MODERATE) return 'MODERATE_SIMILARITY';
  return 'LOW_SIMILARITY';
}

/**
 * Compares an uploaded citizen photo against:
 * 1. Official project photographs
 * 2. Previous citizen submissions for the same project
 *
 * @param {string} uploadedFilePath Absolute path to the uploaded image file
 * @param {Array<string>} [officialImages=[]] Array of official project photo URLs/paths
 * @param {Array<Object>} [previousReports=[]] Array of prior CitizenReport documents
 * @returns {Promise<Object>}
 */
export async function compareCitizenImageWithExisting(
  uploadedFilePath,
  officialImages = [],
  previousReports = []
) {
  try {
    const uploadedHash = await computeImageHash(uploadedFilePath);
    if (!uploadedHash) {
      return {
        hash: null,
        similarityScore: 0,
        result: 'UNAVAILABLE',
        comparedAgainst: 'NONE',
        message: 'Image comparison unavailable; evidence can still be reviewed manually.',
      };
    }

    let highestScore = 0;
    let matchType = 'NONE';
    let matchedSource = null;

    // 1. Compare against official project images
    if (Array.isArray(officialImages) && officialImages.length > 0) {
      for (const officialImg of officialImages) {
        if (!officialImg) continue;
        const offHash = await computeImageHash(officialImg);
        if (offHash) {
          const score = compareHashes(uploadedHash, offHash);
          if (score > highestScore) {
            highestScore = score;
            matchType = 'OFFICIAL_PHOTO';
            matchedSource = officialImg;
          }
        }
      }
    }

    // 2. Compare against previous citizen reports for the same project
    if (Array.isArray(previousReports) && previousReports.length > 0) {
      for (const rep of previousReports) {
        let repHash = rep.imageHash;
        if (!repHash && rep.imageUrl) {
          // Resolve local path or URL
          const localPath = path.join(process.cwd(), rep.imageUrl.replace(/^\//, ''));
          repHash = await computeImageHash(localPath);
        }

        if (repHash) {
          const score = compareHashes(uploadedHash, repHash);
          if (score > highestScore) {
            highestScore = score;
            matchType = 'CITIZEN_REPORT';
            matchedSource = rep.reportId || rep.imageUrl;
          }
        }
      }
    }

    const classification = classifySimilarity(highestScore);

    let message = 'Image appears distinct from existing recorded photographs.';
    if (classification === 'HIGH_SIMILARITY') {
      message =
        matchType === 'OFFICIAL_PHOTO'
          ? 'The submitted image appears highly similar to an existing official project photo. Manual review recommended.'
          : 'The submitted image appears highly similar to a prior citizen report. Potentially repeated image signal.';
    } else if (classification === 'MODERATE_SIMILARITY') {
      message = 'The submitted image shares moderate visual resemblance with an existing record.';
    }

    return {
      hash: uploadedHash,
      similarityScore: highestScore,
      result: classification,
      comparedAgainst: matchType,
      matchedSource,
      message,
    };
  } catch (err) {
    console.error('[compareCitizenImageWithExisting]', err);
    return {
      hash: null,
      similarityScore: 0,
      result: 'UNAVAILABLE',
      comparedAgainst: 'NONE',
      message: 'Image comparison unavailable; evidence can still be reviewed manually.',
    };
  }
}
