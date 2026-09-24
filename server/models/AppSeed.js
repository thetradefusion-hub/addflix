import mongoose from 'mongoose';

const appSeedSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const AppSeed = mongoose.models.AppSeed || mongoose.model('AppSeed', appSeedSchema);

export default AppSeed;
