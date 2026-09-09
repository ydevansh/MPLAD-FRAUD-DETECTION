import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    constituency: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Road Construction',
        'Water Supply',
        'Drainage',
        'Community Hall',
        'Electrification',
        'School Renovation',
        'Health Center',
        'Anganwadi Center',
        'Bus Shelter',
        'Pond Renovation',
        'Solar Lights',
        'Sports Facility',
        'Park Development',
        'Other',
      ],
    },
    // Financial fields (in Lakhs ₹)
    sanctionedAmount: { type: Number, required: true, min: 0 },
    releasedAmount:   { type: Number, default: 0, min: 0 },
    expenditure:      { type: Number, default: 0, min: 0 },

    // Progress fields
    physicalProgress: { type: Number, default: 0, min: 0, max: 100 }, // 0–100 %
    status: {
      type: String,
      required: true,
      enum: ['Sanctioned', 'Ongoing', 'Completed', 'Delayed'],
      default: 'Sanctioned',
    },

    // Timeline fields (Phase 3)
    sanctionDate:           { type: Date, default: null },
    startDate:              { type: Date, default: null },
    expectedCompletionDate: { type: Date, default: null },
    actualCompletionDate:   { type: Date, default: null },
    financialYear:          { type: String, trim: true, default: '' },
    lastUpdated:            { type: Date, default: Date.now },

    implementingAgency: { type: String, default: '' },
    address:   { type: String, default: '' },
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    images:    { type: [String], default: [] },

    // Real risk scoring added in Phase 6 — prototype placeholders only
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    isPrototypeData: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Full-text search index
projectSchema.index({ name: 'text', projectId: 'text', district: 'text', address: 'text', constituency: 'text' });
// Lat/lng index for spatial/distance queries
projectSchema.index({ latitude: 1, longitude: 1 });
// District & category compound index for comparable analytics
projectSchema.index({ district: 1, category: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
