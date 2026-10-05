import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    sponsorId: { type: String, default: '', trim: true },
    referralId: { type: String, unique: true, trim: true },
    otpVerified: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, default: false },
    privacyAccepted: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    country: { type: String, default: 'India', trim: true },
    transactionPin: { type: String, default: '' },
    role: { type: String, default: 'member' },
    adminRole: { type: String, default: '' },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetToken: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.index({ sponsorId: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
