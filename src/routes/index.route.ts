import { Router } from "express";
import servicesRoutes from "./user-service.routes";
import diagnosticRoutes from "./diagnostic.routes";
import pingRoutes from "./ping.routes";
import testRoutes from "./test.routes";
import authRoutes from "./auth.routes";
import otpRoutes from "./otp.routes";
import usersRoutes from "./users.routes";

const router = Router();

// 🎯 REGISTRAR TODAS AS ROTAS COM PREFIXOS ESPECÍFICOS
router.use("/api/OTP", otpRoutes); // ✅ ROTAS OTP
router.use("/api/Users", usersRoutes); // ✅ ROTAS USERS
router.use("/api/Auth", authRoutes); // ✅ ROTAS AUTH
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

      // ✅ ENDPOINTS ATUALIZADOS
      endpoints: {
        "🏠 Principais": {
          "❤️ Health": "/api/health",
          "🏠 Welcome": "/",
          "ℹ️ API Info": "/api/info",
          "📊 API Status": "/api/status",
        },
        "🩺 Diagnóstico Gateway": {
          "🔍 Gateway Status": "/api/diagnostic/gateway-status",
          "⚡ Performance": "/api/diagnostic/gateway-performance",
          "⚙️ Configuração": "/api/diagnostic/gateway-config",
          "❤️ Health Check": "/api/diagnostic/health",
          "📋 Rotas": "/api/diagnostic/gateway-routes",
        },
        "👤 User Service": {
          "🩺 Health": "/api/user-service/health",
          "📡 Ping": "/api/ping/users",
          "🧪 Teste Conexão": "/api/test/auth-service-connection",
          "📊 Info": "/api/user-service/info",
          "📈 Status": "/api/user-service/status",
          "🔄 Gateway Test": "/api/user-service/gateway-test",
          "📡 Ping Gateway": "/api/user-service/ping-gateway",
        },
        "🔐 Autenticação": {
          "👤 Registro": "/api/Auth/register",
          "🔐 Login": "/api/Auth/login",
          "🔄 Refresh Token": "/api/Auth/refresh-token",
          "🚪 Logout": "/api/Auth/logout",
          "🔑 Forgot Password": "/api/Auth/forgot-password",
          "🔄 Reset Password": "/api/Auth/reset-password",
        },
        "📱 OTP": {
          "📤 Send OTP": "/api/OTP/send",
          "✅ Verify OTP": "/api/OTP/verify",
          "🔄 Resend OTP": "/api/OTP/resend",
        },
        "👥 Gestão de Usuários": {
          "👥 Clientes": {
            "📝 Registro": "/api/Users/clients/register",
            "👤 Perfil": "/api/Users/clients/profile",
            "⚙️ Atualizar Perfil": "/api/Users/clients/profile (PATCH)",
            "🎯 Preferências": "/api/Users/clients/preferences",
            "⭐ Pontos Fidelidade":
              "/api/Users/clients/:clientId/loyalty-points",
            "📅 Agendamentos": "/api/Users/clients/:clientId/appointments",
            "👑 Listar (Admin)": "/api/Users/clients",
            "👑 Buscar por ID": "/api/Users/clients/:clientId",
            "👑 Status (Admin)": "/api/Users/clients/:clientId/status",
          },
          "💼 Funcionários": {
            "📝 Registro": "/api/Users/employees/register",
            "👤 Perfil": "/api/Users/employees/profile",
            "⚙️ Atualizar Perfil": "/api/Users/employees/profile (PATCH)",
            "📅 Agenda": "/api/Users/employees/schedule/:employeeId",
            "🟢 Disponibilidade":
              "/api/Users/employees/availability/:employeeId",
            "📋 Lista Pública": "/api/Users/employees/list",
            "🟢 Disponíveis": "/api/Users/employees/available",
            "👤 Perfil Público": "/api/Users/employees/:employeeId/public",
            "⭐ Avaliação": "/api/Users/employees/:employeeId/rating",
            "👑 Listar (Admin)": "/api/Users/employees",
            "👑 Buscar por ID": "/api/Users/employees/:employeeId",
            "👑 Atualizar (Admin)": "/api/Users/employees/:employeeId/admin",
            "👑 Deletar (Admin)": "/api/Users/employees/:employeeId",
          },
          "👨‍💼 Administradores": {
            "📝 Registro": "/api/Users/admins/register",
            "👤 Perfil": "/api/Users/admins/profile",
            "⚙️ Atualizar Perfil": "/api/Users/admins/profile (PATCH)",
            "📊 Estatísticas": "/api/Users/admins/system-stats",
            "👥 Gestão Usuários": "/api/Users/admins/users",
            "👤 Buscar Usuário": "/api/Users/admins/users/:userId",
            "⚙️ Gerenciar Usuário": "/api/Users/admins/manage-user/:userId",
            "🔄 Status Usuário": "/api/Users/admins/users/:userId/status",
            "🗑️ Deletar Usuário": "/api/Users/admins/users/:userId",
            "💾 Backup": "/api/Users/admins/backup",
            "📋 Logs": "/api/Users/admins/logs",
          },
        },
        "🔄 Ping": {
          "👥 Users": "/api/ping/users",
          "🔄 All Services": "/api/ping/all",
        },
        "🧪 Testes": {
          "🔧 Test Connection": "/api/test/connection",
          "🌐 Test Microservices": "/api/test/microservices-connection",
          "🔐 Test Auth Service": "/api/test/auth-service-connection",
          "⚡ Test Performance": "/api/test/performance",
        },
        "🏥 Health Checks": {
          "❤️ Gateway": "/api/health",
          "👥 Clients": "/api/Users/clients/health",
          "💼 Employees": "/api/Users/employees/health",
          "👑 Admins": "/api/Users/admins/health",
        },
      },

      microservices: {
        implemented: ["AUTH-USERS-SERVICE"],
        under_development: [
          "SCHEDULING-SERVICE",
          "EMPLOYEES-SERVICE",
          "SALONS-SERVICE",
          "PAYMENTS-SERVICE",
          "NOTIFICATIONS-SERVICE",
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
        total: 6,
        implemented: 1,
        in_development: 5,
      },
      features: {
        authentication: true,
        user_management: true,
        otp_service: true,
        service_monitoring: true,
        rate_limiting: true,
        cors_management: true,
      },
    },
  });
});

// 🎯 STATUS DOS SERVIÇOS (PÚBLICA)
router.get("/api/status", async (req, res) => {
  try {
    let userServiceStatus = "offline";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        "https://auth-users-service.onrender.com/health",
        {
          method: "GET",
          signal: controller.signal,
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
          "notifications-service": "under_development",
        },
        timestamp: new Date().toISOString(),
        message:
          userServiceStatus === "online"
            ? "✅ Gateway e User Service operacionais"
            : "⚠️ Gateway operacional. User Service offline.",
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
      quick_links: {
        "🚀 Começar": "/api/info",
        "❤️ Saúde": "/api/health",
        "📊 Status": "/api/status",
        "🔐 Autenticação": "/api/Auth/login",
        "👤 User Service": "/api/user-service/health",
        "📱 OTP": "/api/OTP/send",
        "👥 Usuários": "/api/Users/clients/register",
      },
    },
  });
});

// Roteamento para Analytics Service - CENTRO DE INTELIGÊNCIA
router.use('/analytics', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api/analytics'
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`📊 [GATEWAY] Roteando para Centro de Inteligência (Analytics): ${req.method} ${req.url}`);
    },
    error: (err, req, res) => {
      console.error('❌ [GATEWAY] Erro ao conectar com Centro de Inteligência:', err.message);
      res.status(503).json({
        success: false,
        error: 'Centro de Inteligência indisponível',
        code: 'ANALYTICS_SERVICE_DOWN'
      });
    }
  }
}));

export default router;
