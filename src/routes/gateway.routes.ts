// gateway/src/config/routes.ts
import { Router, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";
import { DeviceAnalyticsController } from "../controllers/DeviceAnalytics.Controller";
import { LoggingController } from "../controllers/Logging.Controller";
import { ErrorTrackingController } from "../controllers/ErrorTracking.Controller";
import { DiagnosticController } from "../controllers/Diagnostic.controller";
import { gatewayDiagnostic } from "../utils/diagnostics/gatewayDiagnostic";

const deviceAnalyticsController = new DeviceAnalyticsController();
const loggingController = new LoggingController();
const errorTrackingController = new ErrorTrackingController();
const diagnosticController = new DiagnosticController();

const router = Router();

// ✅ CONFIGURAÇÃO DOS SERVIÇOS (ATUALIZADA)
const SERVICE_CONFIG = {
  AUTH_USERS_SERVICE:
    process.env.AUTH_USERS_SERVICE_URL || "https://auth-users-service.onrender.com",
  NOTIFICATIONS_SERVICE:
    process.env.NOTIFICATIONS_SERVICE_URL || "https://notifications-service-gfoy.onrender.com",
  SCHEDULING_SERVICE:
    process.env.SCHEDULING_SERVICE_URL || "http://localhost:3002",
  EMPLOYEES_SERVICE:
    process.env.EMPLOYEES_SERVICE_URL || "http://localhost:3003",
  SALONS_SERVICE: process.env.SALONS_SERVICE_URL || "http://localhost:3004",
  PAYMENTS_SERVICE: process.env.PAYMENTS_SERVICE_URL || "http://localhost:3005",
  ANALYTICS_SERVICE:
    process.env.ANALYTICS_SERVICE_URL || "http://localhost:3007",
  ADMIN_SERVICE: process.env.ADMIN_SERVICE_URL || "http://localhost:3008",
  LOGGING_SERVICE: process.env.LOGGING_SERVICE_URL || "http://localhost:8080",
};

// 🔄 PROXY SIMPLES (MELHORADO)
const createSimpleProxy = (serviceUrl: string) => {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    timeout: 30000,
    logLevel: "silent",
    onProxyReq: (proxyReq, req) => {
      console.log(
        `🔄 [GATEWAY] Forwarding ${req.method} ${req.url} to ${serviceUrl}`
      );
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error(`❌ [GATEWAY] Proxy error for ${serviceUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: "Service unavailable",
          service: serviceUrl,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
};

// =============================================
// 🆕 ROTAS DE DIAGNÓSTICO DO GATEWAY
// =============================================

router.get("/diagnostics/full", diagnosticController.getFullDiagnostic);
router.get("/diagnostics/quick", diagnosticController.getQuickDiagnostic);
router.get(
  "/diagnostics/services",
  diagnosticController.getAllServicesDiagnostic
);
router.get("/diagnostics/stats", diagnosticController.getGatewayStats);
router.get(
  "/diagnostics/dependencies",
  diagnosticController.getCriticalDependencies
);
router.get(
  "/diagnostics/service/:serviceName",
  diagnosticController.getServiceDiagnostic
);

// =============================================
// 🔄 PROXY PARA TODOS OS SERVIÇOS (ATUALIZADO COM ROLES)
// =============================================

// ✅ AUTH-USERS-SERVICE (ROTAS ATUALIZADAS COM ROLES)
router.use("/auth", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/clients", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/employees", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/admins", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/session", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/verify", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/cleanup", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/profile", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
router.use("/users", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));
// ✅ NOVO - ROTAS DE ROLE MANAGEMENT
router.use("/roles", createSimpleProxy(SERVICE_CONFIG.AUTH_USERS_SERVICE));

// ✅ NOTIFICATION SERVICE (ROTAS ATUALIZADAS)
router.use(
  "/notifications",
  createSimpleProxy(SERVICE_CONFIG.NOTIFICATIONS_SERVICE)
);
router.use("/otp", createSimpleProxy(SERVICE_CONFIG.NOTIFICATIONS_SERVICE));

// ✅ SCHEDULING SERVICE
router.use(
  "/appointments",
  createSimpleProxy(SERVICE_CONFIG.SCHEDULING_SERVICE)
);
router.use(
  "/availability",
  createSimpleProxy(SERVICE_CONFIG.SCHEDULING_SERVICE)
);
router.use("/schedules", createSimpleProxy(SERVICE_CONFIG.SCHEDULING_SERVICE));

// ✅ EMPLOYEES SERVICE
router.use(
  "/employees-service",
  createSimpleProxy(SERVICE_CONFIG.EMPLOYEES_SERVICE)
);
router.use("/skills", createSimpleProxy(SERVICE_CONFIG.EMPLOYEES_SERVICE));

// ✅ SALONS SERVICE
router.use("/salons", createSimpleProxy(SERVICE_CONFIG.SALONS_SERVICE));
router.use("/locations", createSimpleProxy(SERVICE_CONFIG.SALONS_SERVICE));
router.use("/services", createSimpleProxy(SERVICE_CONFIG.SALONS_SERVICE));

// ✅ PAYMENTS SERVICE
router.use("/payments", createSimpleProxy(SERVICE_CONFIG.PAYMENTS_SERVICE));
router.use(
  "/subscriptions",
  createSimpleProxy(SERVICE_CONFIG.PAYMENTS_SERVICE)
);
router.use("/invoices", createSimpleProxy(SERVICE_CONFIG.PAYMENTS_SERVICE));

// ✅ ANALYTICS SERVICE
router.use("/analytics", createSimpleProxy(SERVICE_CONFIG.ANALYTICS_SERVICE));

// ✅ ADMIN SERVICE
router.use("/admin-service", createSimpleProxy(SERVICE_CONFIG.ADMIN_SERVICE));
router.use("/settings", createSimpleProxy(SERVICE_CONFIG.ADMIN_SERVICE));
router.use("/audit", createSimpleProxy(SERVICE_CONFIG.ADMIN_SERVICE));

// =============================================
// 🪵 ROTAS DE LOGGING - DIRETAS NO GATEWAY
// =============================================

router.post("/logs", loggingController.createLog);
router.get("/logs/filters", loggingController.getLogsByFilters);
router.get(
  "/logs/correlation/:correlationId",
  loggingController.getLogsByCorrelationId
);
router.get("/logs/dashboard", loggingController.getDashboardMetrics);
router.get("/logs/stats", loggingController.getStats);

// ✅ ROTAS DE ERROS
router.get("/errors/stats", errorTrackingController.getErrorStats);
router.get("/errors/analysis", errorTrackingController.getErrorAnalysis);
router.get(
  "/errors/microservice/:microservice",
  errorTrackingController.getMicroserviceErrors
);
router.get(
  "/errors/circuit-breaker",
  errorTrackingController.getCircuitBreakerStatus
);

// 📱 ANALYTICS DE DISPOSITIVOS
router.get("/analytics/devices", deviceAnalyticsController.getDeviceAnalytics);
router.get(
  "/analytics/platforms",
  deviceAnalyticsController.getPlatformAnalytics
);
router.get(
  "/analytics/browsers",
  deviceAnalyticsController.getBrowserAnalytics
);
router.get(
  "/analytics/geographic",
  deviceAnalyticsController.getGeographicAnalytics
);
router.get(
  "/analytics/performance",
  deviceAnalyticsController.getPerformanceAnalytics
);
router.get(
  "/analytics/user-agents",
  deviceAnalyticsController.getUserAgentAnalytics
);

// =============================================
// 🏠 ROTAS DO GATEWAY (ATUALIZADAS)
// =============================================

router.get("/", (req: Request, res: Response) => {
  res.json({
    service: "API Gateway",
    status: "running",
    timestamp: new Date().toISOString(),
    version: "2.6.0", // ✅ Atualizada
    features: [
      "simple_proxy_routing",
      "service_discovery",
      "health_checks",
      "timeout_management",
      "integrated_logging_service",
      "rollback_system_support",
      "advanced_diagnostics",
      "role_management_system", // ✅ NOVO
    ],
    diagnostic_endpoints: [
      "/diagnostics/full",
      "/diagnostics/quick",
      "/diagnostics/services",
      "/diagnostics/stats",
      "/diagnostics/dependencies",
      "/diagnostics/service/:serviceName",
    ],
    services: SERVICE_CONFIG,
  });
});

router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    service: "Gateway",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "2.6.0", // ✅ Atualizada
    integrated_features: [
      "logging",
      "error_tracking",
      "metrics_dashboard",
      "rollback_system",
      "diagnostics_system",
      "role_management", // ✅ NOVO
    ],
  });
});

// ✅ STATUS DOS SERVIÇOS (ATUALIZADO)
router.get("/status", async (req: Request, res: Response) => {
  const quickDiagnostic = await gatewayDiagnostic.quickDiagnostic();
  res.json({
    gateway: "RUNNING",
    timestamp: new Date().toISOString(),
    version: "2.6.0", // ✅ Atualizada
    diagnostic: quickDiagnostic,
  });
});

// =============================================
// ❌ 404 HANDLER (ATUALIZADO COM ROTAS DE ROLE)
// =============================================

router.use((req: Request, res: Response) => {
  const path = req.url;

  const errorInfo = {
    source: "gateway_unknown_route",
    user_message: "Endpoint não encontrado no gateway",
    debug_info: "Rota não mapeada para nenhum serviço específico",
  };

  res.status(404).json({
    error: "Endpoint not found",
    path: path,
    method: req.method,
    source: errorInfo.source,
    user_message: errorInfo.user_message,
    debug_info: errorInfo.debug_info,
    timestamp: new Date().toISOString(),
    gateway_version: "2.6.0", // ✅ Atualizada
    correlation_id: req.headers["x-correlation-id"] || "none",
    available_endpoints: [
      // 🆕 DIAGNÓSTICOS
      "GET /diagnostics/full",
      "GET /diagnostics/quick",
      "GET /diagnostics/services",
      "GET /diagnostics/stats",
      "GET /diagnostics/dependencies",
      "GET /diagnostics/service/:serviceName",

      // 👑 ROLE MANAGEMENT (NOVO)
      "GET /roles",
      "GET /roles/class/:class",
      "GET /roles/code/:code", 
      "GET /roles/id/:id",
      "GET /roles/:code/permissions",
      "GET /roles/hierarchy/all",
      "POST /roles/check-permission",
      "POST /roles/validate-code",
      "POST /roles (admin)",
      "PUT /roles/:id (admin)",
      "DELETE /roles/:id (admin)",

      // 🔐 AUTH & USERS
      "POST /auth/login",
      "POST /auth/register",
      "GET /clients/profile",
      "GET /employees/profile",
      "GET /admins/profile",

      // 🧹 CLEANUP & ROLLBACK
      "POST /cleanup/failed-registration",

      // 📧 VERIFICAÇÃO
      "POST /verify/availability",

      // 📱 OTP & NOTIFICAÇÕES
      "POST /otp/send",
      "POST /otp/verify",
      "POST /notifications/send",

      // 🪵 LOGS
      "POST /logs",
      "GET /logs/filters",
      "GET /logs/dashboard",

      // 📊 ANALYTICS
      "GET /analytics/*",

      // 🏥 HEALTH
      "GET /health",
      "GET /status",
    ],
  });
});

export default router;