import rateLimit from "express-rate-limit";

// ✅ CORREÇÃO: Usar valores diretos ou importar config corretamente
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 100;

// 🔐 Rate limiting para autenticação
export const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📧 Rate limiting para OTP
export const otpRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 5, // Apenas 5 tentativas de OTP por 15 minutos
  message: {
    success: false,
    error: "Muitas tentativas de OTP. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🌐 Rate limiting geral para API
export const apiRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: "Muitas requisições. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
