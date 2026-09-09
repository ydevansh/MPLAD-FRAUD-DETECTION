import Project from '../models/Project.js';
import CitizenReport from '../models/CitizenReport.js';
import {
  generateReportId,
  evaluateCitizenLocation,
  assembleVerificationSignals,
  getProjectEvidenceSummary,
} from '../services/citizenVerificationService.js';
import { compareCitizenImageWithExisting } from '../services/imageVerificationService.js';
import { GPS_VERIFICATION_DISCLAIMER } from '../services/geospatialService.js';

/**
 * Phase 8/9 — Citizen Verification & Ground Evidence Controller
 */

// POST /api/projects/:projectId/reports
export const createReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { category, description, latitude, longitude, gpsAccuracy } = req.body;

    // 1. Validate project exists
    const project = await Project.findOne({
      $or: [
        { projectId },
        { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null },
      ],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${projectId}' not found`,
      });
    }

    // 2. Validate category and description
    if (!description || description.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Description / feedback is required (minimum 5 characters).',
      });
    }

    const validCategories = [
      'Project Progress',
      'Project Not Found',
      'Work Quality',
      'Project Status',
      'Project Location',
      'Project Information',
      'Other',
    ];
    const reportCategory = validCategories.includes(category) ? category : 'Project Progress';

    // 3. Process uploaded image if present
    let imageUrl = null;
    let imageOriginalName = null;
    let imageMimeType = null;
    let imageSize = null;
    let imageSimilarity = {
      similarityScore: 0,
      result: 'NONE',
      comparedAgainst: 'NONE',
      message: 'No photo provided for image comparison.',
    };
    let imageHash = null;

    if (req.file) {
      imageUrl = `/uploads/citizen/${req.file.filename}`;
      imageOriginalName = req.file.originalname;
      imageMimeType = req.file.mimetype;
      imageSize = req.file.size;

      // Query prior reports for the same project
      const priorReports = await CitizenReport.find({ projectId: project.projectId }).lean();

      // Compare uploaded photo with official project photos and prior citizen submissions
      const simResult = await compareCitizenImageWithExisting(
        req.file.path,
        project.images || [],
        priorReports
      );

      imageSimilarity = {
        similarityScore: simResult.similarityScore,
        result: simResult.result,
        comparedAgainst: simResult.comparedAgainst,
        matchedSource: simResult.matchedSource,
        message: simResult.message,
      };
      imageHash = simResult.hash;
    }

    // 4. Evaluate GPS proximity against official project location
    const geoEval = evaluateCitizenLocation(project, latitude, longitude, gpsAccuracy);

    // 5. Assemble structured verification signals
    const verificationSignals = assembleVerificationSignals({
      locationStatus: geoEval.locationStatus,
      locationDistanceMeters: geoEval.distanceMeters,
      gpsAccuracy,
      imageSimilarity,
      category: reportCategory,
    });

    // 6. Generate sequential report ID
    const reportId = await generateReportId();

    // 7. Save report to MongoDB
    const newReport = new CitizenReport({
      reportId,
      projectId: project.projectId,
      category: reportCategory,
      description: description.trim(),
      imageUrl,
      imageOriginalName,
      imageMimeType,
      imageSize,
      imageHash,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      gpsAccuracy: gpsAccuracy ? Number(gpsAccuracy) : undefined,
      submittedAt: new Date(), // Enforced server-side
      locationDistanceMeters: geoEval.distanceMeters,
      locationDistanceKm: geoEval.distanceKm,
      locationStatus: geoEval.locationStatus,
      locationSignal: geoEval.locationSignal,
      imageSimilarity,
      verificationSignals,
      status: 'NEW',
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      data: {
        reportId: newReport.reportId,
        projectId: newReport.projectId,
        category: newReport.category,
        locationDistanceMeters: newReport.locationDistanceMeters,
        locationDistanceKm: newReport.locationDistanceKm,
        locationStatus: newReport.locationStatus,
        locationSignal: newReport.locationSignal,
        imageSimilarity: newReport.imageSimilarity,
        verificationSignals: newReport.verificationSignals,
        submittedAt: newReport.submittedAt,
        disclaimer: GPS_VERIFICATION_DISCLAIMER,
      },
    });
  } catch (err) {
    console.error('[createReport]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process and save citizen verification report.',
    });
  }
};

// GET /api/projects/:projectId/reports
// Public list of citizen reports without exposing exact citizen GPS coordinates
export const getProjectReports = async (req, res) => {
  try {
    const { projectId } = req.params;

    const rawReports = await CitizenReport.find({
      $or: [{ projectId }, { projectId: req.params.projectId }],
    })
      .sort({ submittedAt: -1 })
      .lean();

    // Redact exact citizen coordinates for public privacy
    const sanitizedReports = rawReports.map((r) => ({
      _id: r._id,
      reportId: r.reportId,
      projectId: r.projectId,
      category: r.category,
      description: r.description,
      imageUrl: r.imageUrl,
      submittedAt: r.submittedAt,
      locationDistanceMeters: r.locationDistanceMeters,
      locationDistanceKm: r.locationDistanceKm,
      locationStatus: r.locationStatus,
      locationSignal: r.locationSignal,
      imageSimilarity: r.imageSimilarity,
      verificationSignals: r.verificationSignals,
      status: r.status,
    }));

    res.json({
      success: true,
      count: sanitizedReports.length,
      data: sanitizedReports,
    });
  } catch (err) {
    console.error('[getProjectReports]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project citizen reports',
    });
  }
};

// GET /api/projects/:projectId/evidence
// Aggregated verification summary
export const getProjectEvidence = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      $or: [
        { projectId },
        { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null },
      ],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${projectId}' not found`,
      });
    }

    const summary = await getProjectEvidenceSummary(project.projectId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error('[getProjectEvidence]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to compute project evidence summary',
    });
  }
};

// GET /api/admin/citizen-reports
// Authority monitoring view across all reports
export const getAdminCitizenReports = async (req, res) => {
  try {
    const { projectId, category, locationStatus, imageSimilarity, page = 1, limit = 50 } = req.query;

    const query = {};
    if (projectId) query.projectId = { $regex: projectId, $options: 'i' };
    if (category && category !== 'All') query.category = category;
    if (locationStatus && locationStatus !== 'All') query.locationStatus = locationStatus;
    if (imageSimilarity && imageSimilarity !== 'All') {
      query['imageSimilarity.result'] = imageSimilarity;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CitizenReport.countDocuments(query);
    const reports = await CitizenReport.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Authority KPI counts
    const [totalReports, uniqueProjects, reportsWithGPS, reportsWithPhotos] = await Promise.all([
      CitizenReport.countDocuments(),
      CitizenReport.distinct('projectId'),
      CitizenReport.countDocuments({ latitude: { $ne: null } }),
      CitizenReport.countDocuments({ imageUrl: { $ne: null } }),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      metrics: {
        totalReports,
        projectsWithReports: uniqueProjects.length,
        reportsWithGPS,
        reportsWithPhotos,
      },
      data: reports,
    });
  } catch (err) {
    console.error('[getAdminCitizenReports]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve administrative citizen reports',
    });
  }
};

// GET /api/admin/projects/:projectId/evidence
// Detailed evidence inspection cockpit for authorities
export const getAdminProjectEvidence = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      $or: [
        { projectId },
        { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null },
      ],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${projectId}' not found`,
      });
    }

    const [reports, evidenceSummary] = await Promise.all([
      CitizenReport.find({ projectId: project.projectId }).sort({ submittedAt: -1 }).lean(),
      getProjectEvidenceSummary(project.projectId),
    ]);

    res.json({
      success: true,
      data: {
        project: {
          _id: project._id,
          projectId: project.projectId,
          name: project.name,
          category: project.category,
          status: project.status,
          district: project.district,
          state: project.state,
          latitude: project.latitude,
          longitude: project.longitude,
          address: project.address,
          images: project.images || [],
          sanctionedAmount: project.sanctionedAmount,
          expenditure: project.expenditure,
          physicalProgress: project.physicalProgress,
        },
        evidenceSummary,
        reports,
        disclaimer: GPS_VERIFICATION_DISCLAIMER,
      },
    });
  } catch (err) {
    console.error('[getAdminProjectEvidence]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch administrative evidence review data',
    });
  }
};
