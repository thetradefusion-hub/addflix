import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRegistrationInput } from '../utils/authValidation.js';

test('valid registration payload passes validation', () => {
  const result = validateRegistrationInput({
    fullName: 'Rahul Kumar',
    mobile: '+91 9876543210',
    email: 'rahul@example.com',
    username: 'rahul123',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    sponsorId: 'ADD1000',
    otp: '123456',
    termsAccepted: true,
    privacyAccepted: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test('invalid registration payload returns errors', () => {
  const result = validateRegistrationInput({
    fullName: 'R',
    mobile: '123',
    email: 'invalid-email',
    username: '',
    password: '123',
    confirmPassword: '456',
    sponsorId: '',
    otp: '',
    termsAccepted: false,
    privacyAccepted: false,
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 1);
});
