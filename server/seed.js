import bcrypt from 'bcryptjs';
import { connectDb } from './config/db.js';
import AppSeed from './models/AppSeed.js';
import User from './models/User.js';
import { notifications, taskHistory, videos, walletTransactions, incomeSeed, teamMembers, user as mockUser } from '../src/data/mockData.js';

async function seedDatabase() {
  await connectDb();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  const seededUsers = [
    {
      fullName: mockUser.name,
      mobile: '+91 9876543210',
      email: 'rahul.kumar@example.com',
      username: 'rahul123',
      passwordHash,
      sponsorId: 'ADD1000',
      referralId: 'ADD12568',
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: '123456',
      active: true,
    },
    {
      fullName: 'Amit Sharma',
      mobile: '+91 9123456780',
      email: 'amit.sharma@example.com',
      username: 'amit456',
      passwordHash,
      sponsorId: 'ADD12568',
      referralId: 'ADD26891',
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: '654321',
      active: true,
    },
    {
      fullName: 'Neha Verma',
      mobile: '+91 9876501234',
      email: 'neha.verma@example.com',
      username: 'neha789',
      passwordHash,
      sponsorId: 'ADD12568',
      referralId: 'ADD26990',
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: '111111',
      active: true,
    },
  ];

  for (const userData of seededUsers) {
    await User.updateOne(
      { username: userData.username },
      { $set: userData },
      { upsert: true }
    );
  }

  const appSeedData = {
    user: mockUser,
    teamMembers,
    notifications,
    taskHistory,
    videos,
    walletTransactions,
    incomeSeed,
    seedAt: new Date().toISOString(),
  };

  await AppSeed.findOneAndUpdate(
    { key: 'dashboard-demo' },
    { key: 'dashboard-demo', data: appSeedData },
    { upsert: true, new: true }
  );

  console.log('Database seeded successfully with demo users and app data.');
  process.exit(0);
}

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
