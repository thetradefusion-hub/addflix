import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import Account, { defaultDailyTask } from '../models/Account.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { creditSubscriptionReferral } from '../utils/referralCommission.js';
import { ROI_LEVEL_RATES, creditRoiLevelIncome, levelCommission } from '../utils/roiLevelCommission.js';

const TEST_DB = 'addflix_test_roi_level';
const ROI = 2;
let counter = 0;

before(async () => {
  assert.notEqual(TEST_DB, env.mongoDb, 'The test must never run on the live database.');
  await mongoose.connect(env.mongoUri, { dbName: TEST_DB });
  await mongoose.connection.dropDatabase();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

async function member(code, sponsor, active = true) {
  counter += 1;
  const user = await User.create({
    fullName: `Test ${code}`,
    mobile: `90000${String(counter).padStart(5, '0')}`,
    email: `${code.toLowerCase()}@test.local`,
    username: code.toLowerCase(),
    passwordHash: 'x',
    sponsorId: sponsor || '',
    referralId: code,
  });
  await Account.create({ user: user._id, subscription: { active }, dailyTask: defaultDailyTask() });
  return user;
}

async function chain(prefix, size, inactive = []) {
  const uplines = [];
  let sponsor = '';
  for (let level = size; level >= 1; level -= 1) {
    const code = `${prefix}U${level}`;
    await member(code, sponsor, !inactive.includes(level));
    uplines[level] = code;
    sponsor = code;
  }
  const earner = await member(`${prefix}E`, uplines[1]);
  return { earner, uplines };
}

async function account(code) {
  const user = await User.findOne({ referralId: code });
  return Account.findOne({ user: user._id });
}

test('a $2 ROI pays all 15 levels and stops at level 16', async () => {
  const { earner, uplines } = await chain('A', 16);
  const credits = await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-A-1', when: 'now', tx: 'TX' });

  assert.equal(credits.length, 15);
  for (let level = 1; level <= 15; level += 1) {
    const row = await account(uplines[level]);
    assert.equal(row.balances.referral, levelCommission(ROI, level), `level ${level}`);
    assert.equal(row.income[0].type, 'Level Income');
    assert.equal(row.levelCredits[0].rate, ROI_LEVEL_RATES[level - 1]);
  }
  assert.equal((await account(uplines[16])).balances.referral, 0, 'level 16 gets nothing');
  assert.equal((await account('AE')).balances.referral, 0, 'the earner gets no level income');

  const paid = credits.reduce((sum, row) => sum + row.commission, 0);
  assert.equal(Number(paid.toFixed(4)), 0.695, '34.75% of $2');
});

test('the same claim twice never pays twice', async () => {
  const { earner, uplines } = await chain('B', 3);
  await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-B-1', when: 'now', tx: 'TX' });
  const again = await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-B-1', when: 'now', tx: 'TX' });

  assert.equal(again.length, 0);
  assert.equal((await account(uplines[1])).balances.referral, 0.24);
  assert.equal((await account(uplines[1])).levelCredits.length, 1);
});

test('a new day is a new claim and pays again', async () => {
  const { earner, uplines } = await chain('C', 1);
  await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-C-day1', when: 'now', tx: 'TX' });
  await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-C-day2', when: 'now', tx: 'TX' });

  assert.equal((await account(uplines[1])).balances.referral, 0.48);
});

test('an inactive upline is skipped and the next upline keeps its own level', async () => {
  const { earner, uplines } = await chain('D', 4, [2]);
  const credits = await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-D-1', when: 'now', tx: 'TX' });

  assert.equal((await account(uplines[2])).balances.referral, 0, 'inactive L2 gets nothing');
  assert.equal((await account(uplines[1])).balances.referral, 0.24, 'L1 12%');
  assert.deepEqual(credits.map((row) => row.level), [1, 4], 'L3 has only an inactive direct, so it is skipped too');
  assert.equal((await account(uplines[4])).balances.referral, levelCommission(ROI, 4), 'L4 still gets 2.5%');

  const audit = await AuditLog.findOne({ action: 'roi.level.credit', 'meta.claimId': 'ROI-D-1' }).lean();
  assert.ok(audit, 'the claim is recorded for admin');
  assert.deepEqual(audit.meta.credits.map((row) => row.level), [1, 4]);
  assert.deepEqual(audit.meta.skipped.map((row) => [row.level, row.reason]), [[2, 'ID not active'], [3, 'No active direct']]);
  assert.match(audit.note, /skipped L2 .*ID not active/);
});

test('one active direct is compulsory', async () => {
  const { earner, uplines } = await chain('F', 3, [1]);
  await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-F-1', when: 'now', tx: 'TX' });
  assert.equal((await account(uplines[2])).balances.referral, 0, 'L2 only direct is inactive L1');

  await member('FX', uplines[2]);
  await creditRoiLevelIncome({ earner, roi: ROI, claimId: 'ROI-F-2', when: 'now', tx: 'TX' });
  assert.equal((await account(uplines[2])).balances.referral, levelCommission(ROI, 2), 'L2 earns once it has an active direct');
});

test('$10 subscription referral skips an upline whose ID is not active', async () => {
  const { earner, uplines } = await chain('S', 4, [2]);
  const payment = { id: 'SUB-S-1', txHash: 'TX' };
  const credits = await creditSubscriptionReferral({ activatedUser: earner, payment, when: 'now' });

  assert.deepEqual(credits.map((row) => row.level), [1, 3, 4], 'L3 and L4 keep their own level');
  assert.equal((await account(uplines[1])).balances.referral, 2);
  assert.equal((await account(uplines[2])).balances.referral, 0, 'inactive L2 gets nothing');
  assert.equal((await account(uplines[3])).balances.referral, 1);
  assert.equal((await account(uplines[4])).balances.referral, 0.5);
  assert.deepEqual(payment.commissionSkipped.map((row) => [row.level, row.reason]), [[2, 'ID not active']]);

  const audit = await AuditLog.findOne({ action: 'referral.credit', 'meta.paymentId': 'SUB-S-1' }).lean();
  assert.match(audit.note, /skipped L2 SU2 \(ID not active\)/);
});

test('no ROI means no commission', async () => {
  const { earner, uplines } = await chain('G', 1);
  const credits = await creditRoiLevelIncome({ earner, roi: 0, claimId: 'ROI-G-1', when: 'now', tx: 'TX' });
  assert.equal(credits.length, 0);
  assert.equal((await account(uplines[1])).balances.referral, 0);
});
