import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// ✅ CONFIGURAÇÕES DE RATE LIMITING
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 100;

// 🔐 Rate limiting para autenticação
export const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
    code: "AUTH_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown-ip";
  },
  skip: (req: Request): boolean => {
    // Pular rate limiting para health checks em desenvolvimento
    return (
      process.env.NODE_ENV === "development" &&
      (req.path === "/health" || req.path === "/api/health")
    );
  },
});

// 📧 Rate limiting para OTP
export const otpRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 5, // Apenas 5 tentativas de OTP por 15 minutos
  message: {
    success: false,
    error: "Muitas tentativas de OTP. Tente novamente em 15 minutos.",
    code: "OTP_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown-ip";
  },
});

// 🌐 Rate limiting geral para API
export const apiRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: "Muitas requisições. Tente novamente em 15 minutos.",
    code: "API_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown-ip";
  },
  skip: (req: Request): boolean => {
    // Pular rate limiting para health checks e endpoints públicos
    const publicPaths = ["/health", "/api/health", "/api/info", "/api/status"];
    return publicPaths.includes(req.path);
  },
});

// 📧 Rate limiting ESPECÍFICO para check-email (MAIS PERMISSIVO)
export const emailCheckRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (mais permissivo)
  max: 10, // 10 verificações por minuto
  message: {
    success: false,
    error: "Muitas verificações de email. Tente novamente em 1 minuto.",
    code: "EMAIL_CHECK_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown-ip";
  },
  skip: (req: Request): boolean => {
    // Em desenvolvimento, podemos ser mais permissivos
    return process.env.NODE_ENV === "development";
  },
});

// 👑 Rate limiting para administradores (MAIS PERMISSIVO)
export const adminRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 500, // Administradores têm limite maior
  message: {
    success: false,
    error: "Limite de requisições excedido para administradores.",
    code: "ADMIN_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Usar ID do admin se disponível, caso contrário usar IP
    return (req as any).user?.id || req.ip || "unknown-ip";
  },
});

// 🔧 Rate limiting para desenvolvimento (MUITO PERMISSIVO)
export const devRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 1000, // Limite muito alto para desenvolvimento
  message: {
    success: false,
    error: "Rate limiting em desenvolvimento.",
    code: "DEV_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown-ip";
  },
  skip: (req: Request): boolean => {
    // Aplicar apenas em desenvolvimento
    return process.env.NODE_ENV !== "development";
  },
});

// ✅ MIDDLEWARE PARA LOG DE RATE LIMITING
export const rateLimitLogger = (
  req: Request,
  res: Response,
  next: Function
) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    if (res.statusCode === 429) {
      console.log(
        `🚫 Rate Limit Atingido: ${req.method} ${req.path} - IP: ${req.ip}`
      );
    }
    return originalSend.call(this, data);
  };

  next();
};

// ✅ CONFIGURAÇÃO DE RATE LIMITING POR AMBIENTE
export const getRateLimitConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    environment: process.env.NODE_ENV || "development",
    configs: {
      development: {
        globalMax: 1000,
        authMax: 100,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
      production: {
        globalMax: 100,
        authMax: 10,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
      test: {
        globalMax: 10000, // Muito alto para testes
        authMax: 1000,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
    },
  };
};

// ✅ EXPORTAR CONFIGURAÇÕES PARA USO EM OUTROS ARQUIVOS
export default {
  authRateLimit,
  otpRateLimit,
  apiRateLimit,
  emailCheckRateLimit,
  adminRateLimit,
  devRateLimit,
  rateLimitLogger,
  getRateLimitConfig,
};
