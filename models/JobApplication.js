import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  level: { type: String, trim: true, maxlength: 40 },
  school: { type: String, trim: true, maxlength: 160 },
  cityState: { type: String, trim: true, maxlength: 120 },
  from: { type: String, trim: true, maxlength: 30 },
  to: { type: String, trim: true, maxlength: 30 },
  graduated: { type: String, enum: ['', 'yes', 'no'], default: '' },
  credential: { type: String, trim: true, maxlength: 120 }
}, { _id: false });

const employmentSchema = new mongoose.Schema({
  employer: { type: String, trim: true, maxlength: 160 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  address: { type: String, trim: true, maxlength: 200 },
  city: { type: String, trim: true, maxlength: 80 },
  state: { type: String, trim: true, maxlength: 50 },
  zip: { type: String, trim: true, maxlength: 20 },
  startingPay: { type: String, trim: true, maxlength: 40 },
  startingPayType: { type: String, enum: ['', 'hourly', 'salary'], default: '' },
  endingPay: { type: String, trim: true, maxlength: 40 },
  endingPayType: { type: String, enum: ['', 'hourly', 'salary'], default: '' },
  jobTitle: { type: String, trim: true, maxlength: 120 },
  responsibilities: { type: String, trim: true, maxlength: 1200 },
  startDate: { type: String, trim: true, maxlength: 30 },
  endDate: { type: String, trim: true, maxlength: 30 },
  reasonForLeaving: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const referenceSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 120 },
  relationship: { type: String, trim: true, maxlength: 80 },
  company: { type: String, trim: true, maxlength: 140 },
  title: { type: String, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 }
}, { _id: false });

const jobApplicationSchema = new mongoose.Schema({
  applicationNumber: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 140 },
  address: { type: String, required: true, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  state: { type: String, required: true, trim: true, maxlength: 50 },
  zip: { type: String, required: true, trim: true, maxlength: 20 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160, index: true },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  dateAvailable: { type: String, required: true, trim: true, maxlength: 30 },
  desiredPay: { type: String, trim: true, maxlength: 40 },
  desiredPayType: { type: String, enum: ['', 'hourly', 'salary'], default: '' },
  position: { type: String, required: true, trim: true, maxlength: 120, index: true },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'seasonal'], required: true },
  usCitizen: { type: String, enum: ['yes', 'no'], required: true },
  allowedToWork: { type: String, enum: ['', 'yes', 'no'], default: '' },
  previouslyWorked: { type: String, enum: ['yes', 'no'], required: true },
  priorEmploymentDates: { type: String, trim: true, maxlength: 160 },
  felonyConviction: { type: String, enum: ['yes', 'no'], required: true },
  felonyExplanation: { type: String, trim: true, maxlength: 1200 },
  education: { type: [educationSchema], default: [] },
  employmentHistory: { type: [employmentSchema], default: [] },
  references: { type: [referenceSchema], default: [] },
  veteran: { type: String, enum: ['yes', 'no'], required: true },
  militaryBranch: { type: String, trim: true, maxlength: 100 },
  rankAtDischarge: { type: String, trim: true, maxlength: 100 },
  militaryStartDate: { type: String, trim: true, maxlength: 30 },
  militaryEndDate: { type: String, trim: true, maxlength: 30 },
  dischargeType: { type: String, trim: true, maxlength: 100 },
  dischargeExplanation: { type: String, trim: true, maxlength: 1000 },
  backgroundCheckConsent: { type: String, enum: ['yes', 'no'], required: true },
  certificationAccepted: { type: Boolean, required: true },
  signature: { type: String, required: true, trim: true, maxlength: 140 },
  signatureDate: { type: String, required: true, trim: true, maxlength: 30 },
  resumePath: { type: String, trim: true },
  resumeOriginalName: { type: String, trim: true, maxlength: 240 },
  resumeMimeType: { type: String, trim: true, maxlength: 120 },
  status: { type: String, enum: ['new', 'reviewing', 'interview', 'hired', 'not-selected'], default: 'new', index: true },
  adminNotes: { type: String, trim: true, maxlength: 5000 },
  reviewedAt: Date
}, { timestamps: true });

jobApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('JobApplication', jobApplicationSchema);
