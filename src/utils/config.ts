export const SERVICE_CONFIG = {
  AUTH_USERS_SERVICE: process.env.AUTH_USERS_SERVICE_URL || "https://auth-users-service.onrender.com",
  SCHEDULING_SERVICE: process.env.SCHEDULING_SERVICE_URL || "http://localhost:3002",
  EMPLOYEES_SERVICE: process.env.EMPLOYEES_SERVICE_URL || "http://localhost:3003",
  // Para serviços não implementados, use uma URL que retorna 200
  SALONS_SERVICE: process.env.SALONS_SERVICE_URL || "https://httpstat.us/200",
  PAYMENTS_SERVICE: process.env.PAYMENTS_SERVICE_URL || "https://httpstat.us/200",
  NOTIFICATIONS_SERVICE: process.env.NOTIFICATIONS_SERVICE_URL || "https://httpstat.us/200",
} as const;

export const GATEWAY_CONFIG = {
  PORT: parseInt(process.env.PORT || "8080", 10), // 🎯 AGORA É NUMBER
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "gateway-secret-key",
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  SERVICE_TIMEOUT: 10000,
} as const;

export const ROUTES_CONFIG = {
  PUBLIC_ROUTES: [
    "/health",
    "/api/health",
    "/api/services/health",
    "/api/ping/users",
    "/api/test/register",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/otp/send",
    "/otp/verify",
  ],
} as const;

// 🎯 Tipo para a configuração
export type GatewayConfig = {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SERVICE_TIMEOUT: number;
};
