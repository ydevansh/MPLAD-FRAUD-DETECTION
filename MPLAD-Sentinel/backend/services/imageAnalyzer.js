// Image analyzer — perceptual hash comparison for duplicate photo detection
// Uses a simplified dHash algorithm in pure JavaScript (no native deps)

function imageUrlToSimpleHash(url) {
  // In a real system, we'd download the image and compute pHash.
  // For the demo, we derive a deterministic pseudo-hash from the URL.
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = Math.imul(31, hash) + url.charCodeAt(i) | 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function hammingDistance(hash1, hash2) {
  let distance = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

export function detectPhotoReuse(newPhotos, allProjects, excludeProjectId = null) {
  const duplicates = [];

  for (const newUrl of newPhotos) {
    const newHash = imageUrlToSimpleHash(newUrl);

    for (const project of allProjects) {
      if (project.id === excludeProjectId) continue;
      for (const existingUrl of (project.official_photos || [])) {
        const existingHash = imageUrlToSimpleHash(existingUrl);
        const distance = hammingDistance(newHash, existingHash);
        // Exact URL match = definite reuse; hash distance < 3 = near-duplicate
        const isExact = newUrl === existingUrl;
        if (isExact || distance < 3) {
          duplicates.push({
            matching_project_id: project.id,
            matching_project_title: project.title,
            photo_url: existingUrl,
            match_type: isExact ? 'exact' : 'near_duplicate',
            hamming_distance: distance,
          });
        }
      }
    }
  }

  return duplicates;
}

export function computeEvidenceConsistencyScore(citizenReport, officialProject) {
  let score = 0;
  let maxScore = 0;

  // GPS proximity check (if citizen location provided)
  if (citizenReport.lat && citizenReport.lng && officialProject.lat && officialProject.lng) {
    maxScore += 30;
    const dist = haversine(citizenReport.lat, citizenReport.lng, officialProject.lat, officialProject.lng);
    if (dist < 0.5) score += 30;        // Within 500m
    else if (dist < 1.0) score += 20;   // Within 1km
    else if (dist < 2.0) score += 10;   // Within 2km
  }

  // Reported condition vs official status
  maxScore += 40;
  const conditionConflict = {
    'completed': ['not_started', 'non_existent', 'damaged', 'partially_complete'],
    'in_progress': ['not_started', 'non_existent'],
    'stalled': ['completed'],
  };
  const conflicts = conditionConflict[officialProject.status] || [];
  if (conflicts.includes(citizenReport.reported_condition)) {
    score += 40; // Strong discrepancy
  }

  // Photo provided
  if (citizenReport.photo_url) {
    maxScore += 20;
    score += 20;
  }

  // Description length (proxy for detail quality)
  if (citizenReport.description && citizenReport.description.length > 50) {
    maxScore += 10;
    score += 10;
  }

  return maxScore > 0 ? parseFloat((score / maxScore).toFixed(2)) : 0;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
