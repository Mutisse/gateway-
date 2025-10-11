import { Router } from 'express';
import { httpClient } from '../utils/http-client';
import { authRateLimit, otpRateLimit } from '../middleware/rate-limiting.middleware';

const router = Router();

// 🔐 Authentication routes
router.post('/auth/register', authRateLimit, async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/register', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.post('/auth/login', authRateLimit, async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/login', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.post('/auth/refresh', async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/refresh', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.post('/auth/logout', async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/logout', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// 📧 OTP routes
router.post('/otp/send', otpRateLimit, async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/otp/send', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.post('/otp/verify', async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/otp/verify', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// 🔑 Password reset
router.post('/auth/forgot-password', authRateLimit, async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/forgot-password', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.post('/auth/reset-password', async (req, res, next) => {
  try {
    const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/reset-password', req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

export default router;