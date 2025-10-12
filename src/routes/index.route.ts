import { Router } from "express";
import servicesRoutes from "./services.routes";
import diagnosticRoutes from "./diagnostic.routes";
import pingRoutes from "./ping.routes";
import testRoutes from "./test.routes";

const router = Router();

// 🎯 ROTAS DA API (APENAS GATEWAY E MONITORAMENTO)
router.use("/api", servicesRoutes);
router.use("/api", diagnosticRoutes);
router.use("/api", pingRoutes);
router.use("/api", testRoutes);

// 🎯 HEALTH CHECK DA API (PÚBLICA)
router.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway está funcionando",
    data: {
      service: "beautytime-gateway",
      timestamp: new Date().toISOString(),
      version: "1.0.0",

      // 🆕 CATEGORIAS DE ENDPOINTS (APENAS GATEWAY)
      endpoints: {
        "🏠 Principais": {
          "❤️ Health": "/health",
          "🏠 Welcome": "/",
          "ℹ️ API Info": "/api/info",
          "📊 API Status": "/api/status",
        },
        "🩺 Diagnóstico": {
          "🩺 Full Diagnostic": "/api/diagnostic/full",
          "🔍 Services Health": "/api/services/health",
          "📈 System Status": "/api/diagnostic/status",
        },
        "🔄 Ping Services": {
          "👥 Users": "/api/ping/users",
          "📅 Scheduling": "/api/ping/scheduling",
          "💼 Employees": "/api/ping/employees",
          "🏢 Salons": "/api/ping/salons",
          "💰 Payments": "/api/ping/payments",
          "📊 Analytics": "/api/ping/analytics",
          "📱 Notifications": "/api/ping/notifications",
          "🛠️ Admin": "/api/ping/admin",
          "🔄 All Services": "/api/ping/all",
        },
        "🧪 Teste": {
          "🔧 Test Connection": "/api/test/connection",
          "⚡ Test Performance": "/api/test/performance",
        },
      },

      microservices: {
        implemented: ["AUTH-USERS-SERVICE"],
        under_development: [
          "SCHEDULING-SERVICE",
          "EMPLOYEES-SERVICE",
          "SALONS-SERVICE",
          "PAYMENTS-SERVICE",
          "ANALYTICS-SERVICE",
          "NOTIFICATIONS-SERVICE",
          "ADMIN-SERVICE",
        ],
      },
    },
  });
});

// 🎯 INFO DA API (PÚBLICA)
router.get("/api/info", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "BeautyTime Gateway",
      description:
        "API Gateway para o sistema BeautyTime - Plataforma de Gestão de Salões de Beleza",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      status: "running",
      timestamp: new Date().toISOString(),
      architecture: "microservices",
      services: {
        total: 8,
        implemented: 1,
        in_development: 7,
      },
    },
  });
});

// 🎯 STATUS DOS SERVIÇOS (PÚBLICA) - VERSÃO CORRIGIDA
router.get("/api/status", async (req, res) => {
  try {
    let userServiceStatus = "offline";

    try {
      // ✅ SOLUÇÃO: Use AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        "https://auth-users-service.onrender.com/health",
        {
          method: "GET",
          signal: controller.signal, // ✅ Usando signal para timeout
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        userServiceStatus = "online";
      }
    } catch (error: any) {
      userServiceStatus = "offline";
    }

    res.json({
      success: true,
      data: {
        gateway: "running",
        services: {
          "auth-users-service": userServiceStatus,
          "scheduling-service": "under_development",
          "employees-service": "under_development",
          "salons-service": "under_development",
          "payments-service": "under_development",
          "analytics-service": "under_development",
          "notifications-service": "under_development",
          "admin-service": "under_development",
        },
        timestamp: new Date().toISOString(),
        message:
          userServiceStatus === "online"
            ? "Gateway e User Service operacionais"
            : "Gateway operacional. User Service offline.",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Erro ao obter status",
    });
  }
});

// 🎯 ROTA DE BOAS-VINDAS
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bem-vindo ao BeautyTime Gateway API",
    data: {
      service: "BeautyTime Gateway",
      version: "1.0.0",
      documentation: "/api/info",
      health: "/api/health",
      status: "/api/status",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
