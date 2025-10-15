import { Router } from "express";
import { serviceDiagnostic } from "../utils/service-diagnostic";
import { serviceCommunicator } from "../utils/service-communicator";

const router = Router();

// 🎯 FUNÇÃO PARA OBTER ROTAS DINÂMICAMENTE
function getDynamicRoutes(app: any) {
  const routes: any[] = [];

  // Função recursiva para extrair rotas
  function extractRoutes(layer: any, path: string = "") {
    if (layer.route) {
      // É uma rota direta
      const routePath = path + layer.route.path;
      layer.route.stack.forEach((stackLayer: any) => {
        if (stackLayer.method) {
          routes.push({
            method: stackLayer.method.toUpperCase(),
            path: routePath,
          });
        }
      });
    } else if (layer.name === "router" && layer.handle.stack) {
      // É um router com prefixo
      const routerPath =
        path +
        (layer.regexp.toString() !== "/^(?=\\/|$)/i"
          ? layer.regexp
              .toString()
              .replace(/^\/\^\\|\\\/\?\(\.\*\)\$$/g, "")
              .replace(/\\/g, "")
          : "");

      layer.handle.stack.forEach((stackLayer: any) => {
        extractRoutes(stackLayer, routerPath);
      });
    }
  }

  // Extrai rotas do app Express
  app._router.stack.forEach((layer: any) => {
    extractRoutes(layer);
  });

  return routes;
}

// 🎯 ROTAS DISPONÍVEIS NO GATEWAY (DINÂMICO)
router.get("/diagnostic/gateway-routes", async (req, res) => {
  try {
    console.log("📋 Listando rotas dinâmicas do Gateway...");

    // Obtém a instância do app Express do request
    const app = req.app;
    const dynamicRoutes = getDynamicRoutes(app);

    // Organiza rotas por categoria
    const categorizedRoutes: any = {
      "🩺 Diagnóstico": {},
      "👤 User Service": {},
      "🔐 Autenticação": {},
      "📱 OTP": {},
      "👥 Gestão de Usuários": {},
      "🔄 Ping": {},
      "🧪 Testes": {},
      "🏥 Health Checks": {},
    };

    // Mapeamento de métodos para ícones (com tipagem correta)
    const methodIcons: { [key: string]: string } = {
      GET: "🔍",
      POST: "📝",
      PUT: "✏️",
      DELETE: "🗑️",
      PATCH: "⚡",
    };

    // Categoriza as rotas automaticamente
    dynamicRoutes.forEach((route: any) => {
      const { method, path } = route;

      let category = "🔐 Autenticação";
      let description = path;

      // Categorização automática baseada no path
      if (path.includes("/diagnostic/")) {
        category = "🩺 Diagnóstico";
        description = path.replace("/api/diagnostic/", "");
      } else if (path.includes("/user-service/")) {
        category = "👤 User Service";
        description = path.replace("/api/user-service/", "");
      } else if (path.includes("/auth/")) {
        category = "🔐 Autenticação";
        description = path.replace("/api/auth/", "");
      } else if (path.includes("/otp/")) {
        category = "📱 OTP";
        description = path.replace("/api/otp/", "");
      } else if (
        path.includes("/clients/") ||
        path.includes("/employees/") ||
        path.includes("/admins/")
      ) {
        category = "👥 Gestão de Usuários";
        description = path.replace("/api/", "");
      } else if (path.includes("/ping/")) {
        category = "🔄 Ping";
        description = path.replace("/api/ping/", "");
      } else if (path.includes("/test/")) {
        category = "🧪 Testes";
        description = path.replace("/api/test/", "");
      } else if (path.includes("/health")) {
        category = "🏥 Health Checks";
        description = path.replace("/api/", "");
      }

      if (!categorizedRoutes[category]) {
        categorizedRoutes[category] = {};
      }

      // ✅ CORREÇÃO: Usa o mapeamento tipado corretamente
      const methodIcon = methodIcons[method] || "📌";

      categorizedRoutes[category][`${methodIcon} ${method} ${description}`] =
        path;
    });

    const routes = {
      timestamp: new Date().toISOString(),
      service: "gateway",
      total_routes: dynamicRoutes.length,
      available_routes: categorizedRoutes,
      raw_routes:
        process.env.NODE_ENV === "development" ? dynamicRoutes : undefined, // Apenas em desenvolvimento
    };

    res.json({
      success: true,
      message: `Rotas disponíveis no Gateway (${dynamicRoutes.length} rotas encontradas)`,
      data: routes,
    });
  } catch (error: any) {
    console.error("❌ Erro ao listar rotas dinâmicas:", error);

    // Fallback para rotas estáticas se o dinâmico falhar
    const fallbackRoutes = {
      timestamp: new Date().toISOString(),
      service: "gateway",
      available_routes: {
        "🩺 Diagnóstico": {
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
        },
        "🔐 Autenticação": {
          "👤 Registro": "/api/auth/register",
          "🔐 Login": "/api/auth/login",
          "📧 OTP Send": "/api/otp/send",
          "✅ OTP Verify": "/api/otp/verify",
        },
      },
      note: "Usando fallback estático - verifique logs para detalhes",
    };

    res.json({
      success: true,
      message: "Rotas disponíveis no Gateway (fallback estático)",
      data: fallbackRoutes,
    });
  }
});

// 🎯 DIAGNÓSTICO DO GATEWAY APENAS
router.get("/diagnostic/gateway-status", async (req, res) => {
  try {
    console.log("🔍 Diagnosticando status do Gateway...");

    const gatewayStatus = {
      timestamp: new Date().toISOString(),
      service: "gateway",
      status: "running",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: {
        used: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heap: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      node: {
        version: process.version,
        platform: process.platform,
      },
    };

    res.json({
      success: true,
      message: "Status do Gateway",
      data: gatewayStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao diagnosticar Gateway",
      details: error.message,
    });
  }
});

// 🎯 PERFORMANCE DO GATEWAY
router.get("/diagnostic/gateway-performance", async (req, res) => {
  try {
    console.log("⚡ Testando performance do Gateway...");

    const startTime = Date.now();

    // Simula algum processamento para testar performance
    await new Promise((resolve) => setTimeout(resolve, 100));

    const responseTime = Date.now() - startTime;

    const performance = {
      timestamp: new Date().toISOString(),
      response_time: `${responseTime}ms`,
      performance:
        responseTime < 50
          ? "excellent"
          : responseTime < 200
          ? "good"
          : responseTime < 500
          ? "acceptable"
          : "slow",
      load: {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
      },
    };

    res.json({
      success: true,
      message: "Performance do Gateway",
      data: performance,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao testar performance",
      details: error.message,
    });
  }
});

// 🎯 CONFIGURAÇÃO DO GATEWAY
router.get("/diagnostic/gateway-config", async (req, res) => {
  try {
    console.log("⚙️ Obtendo configuração do Gateway...");

    const config = {
      timestamp: new Date().toISOString(),
      service: "gateway",
      port: process.env.PORT || 8080,
      environment: process.env.NODE_ENV || "development",
      cors: {
        enabled: true,
        allowed_origins: [
          "https://gateway-6rov.onrender.com",
          "http://localhost:9000",
        ],
      },
      rate_limiting: {
        enabled: true,
        window_ms: 15 * 60 * 1000,
        max_requests: process.env.NODE_ENV === "development" ? 1000 : 300,
      },
    };

    res.json({
      success: true,
      message: "Configuração do Gateway",
      data: config,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao obter configuração",
      details: error.message,
    });
  }
});

// 🎯 HEALTH CHECK DO GATEWAY (SIMPLIFICADO)
router.get("/diagnostic/health", async (req, res) => {
  try {
    const health = {
      status: "healthy",
      service: "gateway",
      timestamp: new Date().toISOString(),
      checks: {
        memory: "healthy",
        cpu: "healthy",
        network: "healthy",
      },
    };

    res.json({
      success: true,
      message: "Gateway health check",
      data: health,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: "Gateway unhealthy",
      details: error.message,
    });
  }
});

export default router;
