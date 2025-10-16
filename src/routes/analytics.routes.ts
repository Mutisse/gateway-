import { Router, Request, Response } from "express";
import { SERVICE_CONFIG, ROUTES_CONFIG } from "../utils/config";

const router = Router();

// ✅ DASHBOARD DE ANALÍTICAS
router.get("/dashboard", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      services: SERVICE_CONFIG,
      publicRoutes: ROUTES_CONFIG.PUBLIC_ROUTES,
      timestamp: new Date().toISOString(),
      metrics: {
        totalServices: Object.keys(SERVICE_CONFIG).length,
        totalPublicRoutes: ROUTES_CONFIG.PUBLIC_ROUTES.length,
        environment: process.env.NODE_ENV || "development",
      },
    },
  });
});

// ✅ STATUS DOS SERVIÇOS
router.get("/services/status", async (req: Request, res: Response) => {
  try {
    const serviceStatus = await Promise.all(
      Object.entries(SERVICE_CONFIG).map(async ([serviceName, serviceUrl]) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(serviceUrl, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          return {
            service: serviceName,
            url: serviceUrl,
            status: response.ok ? "online" : "offline",
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          return {
            service: serviceName,
            url: serviceUrl,
            status: "offline",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        services: serviceStatus,
        summary: {
          total: serviceStatus.length,
          online: serviceStatus.filter((s) => s.status === "online").length,
          offline: serviceStatus.filter((s) => s.status === "offline").length,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Erro ao verificar status dos serviços",
      message: error.message,
    });
  }
});

// ✅ CONFIGURAÇÕES DO SISTEMA
router.get("/config", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      serviceConfig: SERVICE_CONFIG,
      routesConfig: ROUTES_CONFIG,
      environment: {
        NODE_ENV: process.env.NODE_ENV || "development",
        NODE_VERSION: process.version,
        PLATFORM: process.platform,
        UPTIME: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// ✅ ROTAS PÚBLICAS
router.get("/routes/public", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      publicRoutes: ROUTES_CONFIG.PUBLIC_ROUTES,
      totalRoutes: ROUTES_CONFIG.PUBLIC_ROUTES.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// ✅ HEALTH CHECK ESPECÍFICO PARA ANALYTICS
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: "analytics",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      endpoints: {
        dashboard: "/api/analytics/dashboard",
        servicesStatus: "/api/analytics/services/status",
        config: "/api/analytics/config",
        publicRoutes: "/api/analytics/routes/public",
        health: "/api/analytics/health",
      },
    },
  });
});

// ✅ ESTATÍSTICAS DE USO
router.get("/usage", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      services: Object.keys(SERVICE_CONFIG).map((serviceName) => ({
        name: serviceName,
        url: SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG],
        type: serviceName.toLowerCase().includes("service")
          ? "microservice"
          : "api",
      })),
      publicRoutes: {
        total: ROUTES_CONFIG.PUBLIC_ROUTES.length,
        authentication: ROUTES_CONFIG.PUBLIC_ROUTES.filter(
          (route) => route.includes("/Auth") || route.includes("/OTP")
        ).length,
        users: ROUTES_CONFIG.PUBLIC_ROUTES.filter((route) =>
          route.includes("/Users")
        ).length,
        system: ROUTES_CONFIG.PUBLIC_ROUTES.filter(
          (route) =>
            route.includes("/health") ||
            route.includes("/ping") ||
            route.includes("/test")
        ).length,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
