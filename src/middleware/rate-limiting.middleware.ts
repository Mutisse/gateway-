// src/middleware/rate-limiting.middleware.ts
import rateLimit from "express-rate-limit";

// ✅ CONFIGURAÇÕES DE RATE LIMITING OTIMIZADAS
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const SHORT_WINDOW_MS = 1 * 60 * 1000; // 1 minuto para OTP

// 🛡️ PROTEÇÃO GLOBAL
const globalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 200,
  message: {
    success: false,
    error: "Muitas requisições. Tente novamente em 15 minutos.",
    code: "RATE_LIMIT_GLOBAL",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const excludedPaths = ["/health", "/status", "/api/health", "/api/diagnostic"];
    return excludedPaths.includes(req.path);
  },
});

// 🔐 RATE LIMITING ESPECÍFICO - OTP MAIS PERMISSIVO
const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  message: {
    success: false,
    error: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
    code: "RATE_LIMIT_AUTH",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 20,
  message: {
    success: false,
    error: "Muitas verificações de email. Tente novamente em 15 minutos.",
    code: "RATE_LIMIT_EMAIL",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ OTP COM LIMITES MAIS RAZOÁVEIS
const otpRateLimit = rateLimit({
  windowMs: SHORT_WINDOW_MS, // 1 minuto em vez de 15
  max: 3, // 3 tentativas por minuto (em vez de 5 por 15min)
  message: {
    success: false,
    error: "Muitas tentativas de OTP. Tente novamente em 1 minuto.",
    code: "RATE_LIMIT_OTP",
    retryAfter: 60 // Segundos
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit por email + IP
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  },
  skip: (req) => {
    // Permite health checks
    return req.path === '/health' || req.path === '/status';
  }
});

// ✅ RATE LIMITING PARA VERIFICAÇÃO DE EMAIL (separado do OTP)
const emailVerificationRateLimit = rateLimit({
  windowMs: 30 * 1000, // 30 segundos
  max: 5, // 5 verificações por 30 segundos
  message: {
    success: false,
    error: "Muitas verificações de email. Aguarde 30 segundos.",
    code: "RATE_LIMIT_EMAIL_VERIFICATION",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
  globalRateLimit,
  authRateLimit,
  emailRateLimit,
  otpRateLimit,
  emailVerificationRateLimit,
};