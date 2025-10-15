export const SERVICE_CONFIG = {
  AUTH_USERS_SERVICE:
    process.env.AUTH_USERS_SERVICE_URL || "http://localhost:3001/UserService",
  SCHEDULING_SERVICE:
    process.env.SCHEDULING_SERVICE_URL || "http://localhost:3002",
  EMPLOYEES_SERVICE:
    process.env.EMPLOYEES_SERVICE_URL || "http://localhost:3003",
  SALONS_SERVICE: process.env.SALONS_SERVICE_URL || "https://httpstat.us/200",
  PAYMENTS_SERVICE:
    process.env.PAYMENTS_SERVICE_URL || "https://httpstat.us/200",
  NOTIFICATIONS_SERVICE:
    process.env.NOTIFICATIONS_SERVICE_URL || "https://httpstat.us/200",
} as const;

export const ROUTES_CONFIG = {
  PUBLIC_ROUTES: [
    "/health",
    "/api/health",
    "/api/services/health",
    "/api/ping/users",
    "/api/test/register",
    "/api/Auth/check-email", // ✅ ADICIONAR AQUI TAMBÉM
    "/api/Auth/login",
    "/api/Auth/register", 
    "/api/Auth/forgot-password",
    "/api/Auth/reset-password",
    "/api/OTP/send",
    "/api/OTP/verify",
    "/api/OTP/resend",
    "/api/Users/clients/register",
    "/api/Users/employees/register",
  ],
} as const;