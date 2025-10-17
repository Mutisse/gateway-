import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// ✅ CONFIGURAÇÕES DE RATE LIMITING SUPER PERMISSIVAS
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 100;

// 📧 Rate limiting MUITO PERMISSIVO para check-email (SOLUÇÃO DO PROBLEMA)
export const emailCheckRateLimit = rateLimit({
  windowMs: 30 * 1000, // Apenas 30 SEGUNDOS!
  max: 50, // 50 verificações por 30 segundos
  message: {
    success: false,
    error: "Muitas verificações de email. Tente novamente em 30 segundos.",
    code: "EMAIL_CHECK_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown-ip";
  },
  skip: (req: Request): boolean => {
    // ✅ EM DESENVOLVIMENTO, NÃO APLICAR RATE LIMITING
    return process.env.NODE_ENV === "development";
  },
});

// 🔐 Rate limiting para autenticação (MAIS PERMISSIVO)
export const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 200, // Aumentado para 200
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

// 📧 Rate limiting para OTP (MAIS PERMISSIVO)
export const otpRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10, // Aumentado para 10
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

// 🌐 Rate limiting geral para API (MAIS PERMISSIVO)
export const apiRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 500, // Aumentado para 500
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
    const publicPaths = [
      "/health",
      "/api/health",
      "/api/info",
      "/api/status",
      "/api/debug",
      "/api/cors-info",
      "/api/cors-test",
    ];
    return publicPaths.some((path) => req.path.startsWith(path));
  },
});

// 👑 Rate limiting para administradores (MUITO PERMISSIVO)
export const adminRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 1000, // Administradores têm limite muito alto
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

// 🔧 Rate limiting para desenvolvimento (SEM LIMITES PRÁTICOS)
export const devRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 5000, // Limite extremamente alto para desenvolvimento
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

// ✅ MIDDLEWARE PARA LOG DE RATE LIMITING (MELHORADO)
export const rateLimitLogger = (
  req: Request,
  res: Response,
  next: Function
) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    if (res.statusCode === 429) {
      console.log(
        `🚫 RATE LIMIT NO GATEWAY: ${req.method} ${req.path} - IP: ${req.ip}`
      );
      console.log(`📊 Headers:`, {
        "x-ratelimit-limit": res.getHeader("x-ratelimit-limit"),
        "x-ratelimit-remaining": res.getHeader("x-ratelimit-remaining"),
        "x-ratelimit-reset": res.getHeader("x-ratelimit-reset"),
      });
    }
    return originalSend.call(this, data);
  };

  next();
};

// ✅ CONFIGURAÇÃO DE RATE LIMITING POR AMBIENTE (ATUALIZADA)
export const getRateLimitConfig = () => {
  const environment = process.env.NODE_ENV || "development";

  const configs = {
    development: {
      globalMax: 5000,
      authMax: 200,
      emailCheckMax: 50,
      emailCheckWindow: "30 segundos",
      windowMs: RATE_LIMIT_WINDOW_MS,
      description: "LIMITES MUITO ALTOS PARA DESENVOLVIMENTO",
    },
    production: {
      globalMax: 500,
      authMax: 200,
      emailCheckMax: 50,
      emailCheckWindow: "30 segundos",
      windowMs: RATE_LIMIT_WINDOW_MS,
      description: "LIMITES PERMISSIVOS PARA EVITAR 429",
    },
    test: {
      globalMax: 10000,
      authMax: 1000,
      emailCheckMax: 100,
      emailCheckWindow: "30 segundos",
      windowMs: RATE_LIMIT_WINDOW_MS,
      description: "LIMITES MÁXIMOS PARA TESTES",
    },
  };

  return {
    environment,
    currentConfig:
      configs[environment as keyof typeof configs] || configs.development,
    allConfigs: configs,
  };
};

// ✅ ENDPOINT DE DEBUG PARA RATE LIMITING
export const rateLimitDebug = (req: Request, res: Response) => {
  const config = getRateLimitConfig();

  res.json({
    success: true,
    data: {
      environment: config.environment,
      currentConfig: config.currentConfig,
      clientInfo: {
        ip: req.ip,
        forwardedFor: req.headers["x-forwarded-for"],
        realIp: req.headers["x-real-ip"],
        userAgent: req.headers["user-agent"]?.substring(0, 100),
      },
      timestamp: new Date().toISOString(),
      note: "✅ Rate limiting configurado para ser MUITO PERMISSIVO",
    },
  });
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
  rateLimitDebug,
};
