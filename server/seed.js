import bcrypt from 'bcryptjs';
import { connectDb } from './config/db.js';
import AppSeed from './models/AppSeed.js';
import Account, { defaultDailyTask } from './models/Account.js';
import { demoInvestments } from './utils/plans.js';
import LoginSession from './models/LoginSession.js';
import User from './models/User.js';
import {
  deposits,
  incomeSeed,
  notifications,
  taskHistory,
  videos,
  walletAddress,
  walletTransactions,
  withdrawals,
  teamMembers,
  user as mockUser,
} from '../src/data/mockData.js';

async function seedDatabase() {
  await connectDb();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  const seededUsers = [
    {
      fullName: 'ADD FLIX',
      mobile: '+91 9000000001',
      email: 'platform@addflix.demo',
      username: 'addflix',
      passwordHash,
      sponsorId: '',
      referralId: 'ADD1000',
      country: 'India',
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: '000000',
      active: true,
    },
    {
      fullName: mockUser.name,
      mobile: '+91 9876543210',
      email: 'rahul.kumar@example.com',
      username: 'rahul123',
      passwordHash,
      sponsorId: 'ADD1000',
      referralId: 'ADD12568',
      country: 'India',
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
      country: 'India',
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
      country: 'India',
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

  const rahul = await User.findOne({ email: 'rahul.kumar@example.com' });
  const amit = await User.findOne({ email: 'amit.sharma@example.com' });
  const neha = await User.findOne({ email: 'neha.verma@example.com' });
  const platform = await User.findOne({ email: 'platform@addflix.demo' });

  const accounts = [
    {
      user: rahul._id,
      walletAddress,
      balances: { total: 42.5, roi: 28.5, referral: 10, bonus: 2.5, locked: 1.5 },
      transactions: walletTransactions,
      deposits,
      withdrawals,
      income: incomeSeed,
      tasks: taskHistory,
      subscription: { active: true, paymentState: 'success', txHash: '0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1', amount: 10, network: 'BEP-20', activatedAt: '24 Sep 2026, 10:24 AM' },
      subscriptionPayments: [{ id: 'sub-rahul', txHash: '0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1', amount: 10, network: 'BEP-20', status: 'Success', submittedAt: '24 Sep 2026, 10:20 AM', verifiedAt: '24 Sep 2026, 10:24 AM', commissionPaid: true }],
      investments: demoInvestments(28.5),
      dailyTask: defaultDailyTask(),
    },
    {
      user: amit._id,
      walletAddress,
      balances: { total: 12, roi: 8, referral: 4, bonus: 0, locked: 0 },
      subscription: { active: true, paymentState: 'success', txHash: '0xamitdemo1234', amount: 10, network: 'BEP-20', activatedAt: '22 Jul 2026, 09:00 AM' },
      subscriptionPayments: [{ id: 'sub-amit', txHash: '0xamitdemo1234', amount: 10, network: 'BEP-20', status: 'Success', submittedAt: '22 Jul 2026, 08:40 AM', verifiedAt: '22 Jul 2026, 09:00 AM' }],
      dailyTask: defaultDailyTask(),
    },
    {
      user: platform._id,
      walletAddress,
      balances: { total: 0, roi: 0, referral: 0, bonus: 0, locked: 0 },
      subscription: { active: true, paymentState: 'success', txHash: '0xplatform', amount: 10, network: 'BEP-20', activatedAt: '01 Jan 2026, 10:00 AM' },
      subscriptionPayments: [{ id: 'sub-platform', txHash: '0xplatform', amount: 10, network: 'BEP-20', status: 'Success', submittedAt: '01 Jan 2026, 10:00 AM', verifiedAt: '01 Jan 2026, 10:00 AM', commissionPaid: true, commissions: [] }],
      dailyTask: defaultDailyTask(),
    },
    {
      user: neha._id,
      walletAddress,
      balances: { total: 6, roi: 4, referral: 2, bonus: 0, locked: 0 },
      subscription: { active: true, paymentState: 'success', txHash: '0xnehademo1234', amount: 10, network: 'BEP-20', activatedAt: '21 Jul 2026, 04:10 PM' },
      subscriptionPayments: [{ id: 'sub-neha', txHash: '0xnehademo1234', amount: 10, network: 'BEP-20', status: 'Success', submittedAt: '21 Jul 2026, 04:00 PM', verifiedAt: '21 Jul 2026, 04:10 PM' }],
      dailyTask: defaultDailyTask(),
    },
  ];

  for (const account of accounts) {
    await Account.findOneAndUpdate({ user: account.user }, { $set: account }, { upsert: true });
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

  await LoginSession.deleteMany({ user: rahul._id });
  await LoginSession.insertMany([
    {
      user: rahul._id,
      device: "Safari · iPhone",
      ip: "49.36.xx.xx",
      location: "Delhi, IN",
      current: false,
      loggedAt: new Date("2026-09-24T15:12:00Z"),
      endedAt: new Date("2026-09-24T18:40:00Z"),
    },
    {
      user: rahul._id,
      device: "Chrome · Android",
      ip: "106.219.xx.xx",
      location: "Noida, IN",
      current: false,
      loggedAt: new Date("2026-09-22T05:35:00Z"),
      endedAt: new Date("2026-09-22T06:10:00Z"),
    },
  ]);

  console.log('Database seeded successfully with demo users and app data.');
  process.exit(0);
}

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
