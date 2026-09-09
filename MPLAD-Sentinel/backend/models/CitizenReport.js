import mongoose from 'mongoose';

/**
 * Phase 8/9 — Citizen Verification Report Model
 * MPLAD-Sentinel (SIH26102)
 *
 * Captures ground evidence submitted by citizens:
 * Photo + GPS + Timestamp + Feedback
 * Evaluates proximity against official project coordinates.
 * Evaluates image similarity against official project photos and prior reports.
 */
const citizenReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Project Progress',
        'Project Not Found',
        'Work Quality',
        'Project Status',
        'Project Location',
        'Project Information',
        'Other',
      ],
      default: 'Project Progress',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // Image evidence
    imageUrl: {
      type: String,
      required: false,
    },
    imageOriginalName: {
      type: String,
      required: false,
    },
    imageMimeType: {
      type: String,
      required: false,
    },
    imageSize: {
      type: Number,
      required: false,
    },
    imageHash: {
      type: String,
      required: false,
    },
    // Citizen GPS location
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
    gpsAccuracy: {
      type: Number, // in meters
      required: false,
    },
    // Server-enforced timestamp
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    // Geospatial consistency metrics
    locationDistanceMeters: {
      type: Number,
      required: false,
    },
    locationDistanceKm: {
      type: Number,
      required: false,
    },
    locationStatus: {
      type: String,
      enum: ['VERY_CLOSE', 'CLOSE', 'NEARBY', 'FAR', 'FAR_FROM_PROJECT', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    locationSignal: {
      type: String,
      required: false,
    },
    // Image similarity analysis
    imageSimilarity: {
      similarityScore: {
        type: Number,
        default: 0,
      },
      result: {
        type: String,
        enum: ['HIGH_SIMILARITY', 'MODERATE_SIMILARITY', 'LOW_SIMILARITY', 'UNAVAILABLE', 'NONE'],
        default: 'NONE',
      },
      comparedAgainst: {
        type: String,
        enum: ['OFFICIAL_PHOTO', 'CITIZEN_REPORT', 'NONE'],
        default: 'NONE',
      },
      matchedSource: {
        type: String,
        required: false,
      },
      message: {
        type: String,
        required: false,
      },
    },
    // Structured verification signals
    verificationSignals: [
      {
        type: {
          type: String,
          required: true,
        },
        severity: {
          type: String,
          enum: ['LOW', 'MEDIUM', 'HIGH', 'INFO'],
          default: 'INFO',
        },
        title: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['NEW', 'REVIEWED', 'FLAGGED'],
      default: 'NEW',
    },
  },
  {
    timestamps: true,
  }
);

const CitizenReport = mongoose.model('CitizenReport', citizenReportSchema);

export default CitizenReport;
