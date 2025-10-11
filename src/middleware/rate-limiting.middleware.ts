import rateLimit from 'express-rate-limit';
import { GATEWAY_CONFIG } from '../utils/config';

export const globalRateLimit = rateLimit({
  windowMs: GATEWAY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: GATEWAY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMITED'
  }
});

export const otpRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 OTP requests per minute
  message: {
    success: false,
    error: 'Too many OTP requests, please try again later',
    code: 'OTP_RATE_LIMITED'
  }
});