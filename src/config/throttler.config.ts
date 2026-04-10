
export const AUTH_THROTTLE = {
  LOGIN: { limit: 5, ttl: 60000 },
  RESEND_REGISTER_EMAIL: { limit: 3, ttl: 15 * 60 * 1_000 },
  VERIFY_REGISTER_EMAIL: {limit: 10, ttl: 5 * 60 * 1_000},
  FORGOT_PASS: {limit: 1, ttl: 2 * 60 * 1_000},
  VERIFY_OTP: {limit: 5, ttl: 5 * 60 * 1_000}
};