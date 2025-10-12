import { Router } from "express";
import { serviceCommunicator } from "../utils/service-communicator";

const router = Router();

// 🔧 Rota de teste de conexão BÁSICA
router.get("/test/connection", (req, res) => {
  res.json({
    success: true,
    message: "Teste de conexão e latência do Gateway",
    data: {
      timestamp: new Date().toISOString(),
      gateway: "online",
      response_time: `${
        Date.now() -
        new Date(
          (req.headers["x-request-time"] as string) || Date.now()
        ).getTime()
      }ms`,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    },
  });
});

// 🌐 Rota de teste de conexão com TODOS os microserviços
router.get("/test/microservices-connection", async (req, res) => {
  const startTime = Date.now();

  try {
    // Lista de todos os microserviços para testar
    const microservices = [
      {
        name: "AUTH-USERS-SERVICE",
        url: process.env.AUTH_USERS_SERVICE_URL || "https://auth-users-service.onrender.com",
        healthEndpoint: "/health",
        implemented: true,
      },
      {
        name: "SCHEDULING-SERVICE",
        url: process.env.SCHEDULING_SERVICE_URL || "http://localhost:3002",
        healthEndpoint: "/health",
        implemented: false,
      },
      {
        name: "EMPLOYEES-SERVICE",
        url: process.env.EMPLOYEES_SERVICE_URL || "http://localhost:3003",
        healthEndpoint: "/health",
        implemented: false,
      },
      {
        name: "SALONS-SERVICE",
        url: process.env.SALONS_SERVICE_URL || "http://localhost:3004",
        healthEndpoint: "/health",
        implemented: false,
      },
      {
        name: "PAYMENTS-SERVICE",
        url: process.env.PAYMENTS_SERVICE_URL || "http://localhost:3005",
        healthEndpoint: "/health",
        implemented: false,
      },
    ];

    const connectionResults = await Promise.all(
      microservices.map(async (service) => {
        const serviceStartTime = Date.now();

        try {
          if (service.implemented) {
            // Para serviços implementados, testa conexão real
            const response = await fetch(
              `${service.url}${service.healthEndpoint}`,
              {
                method: "GET",
                signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
              }
            );

            const responseTime = Date.now() - serviceStartTime;

            return {
              service: service.name,
              status: response.ok ? "online" : "offline",
              response_time: `${responseTime}ms`,
              url: service.url,
              implemented: true,
              http_status: response.status,
            };
          } else {
            // Para serviços não implementados
            return {
              service: service.name,
              status: "not_implemented",
              response_time: "0ms",
              url: service.url,
              implemented: false,
              message: "Serviço em desenvolvimento",
            };
          }
        } catch (error: any) {
          const responseTime = Date.now() - serviceStartTime;

          return {
            service: service.name,
            status: "offline",
            response_time: `${responseTime}ms`,
            url: service.url,
            implemented: service.implemented,
            error: error.message || "Connection failed",
            details: service.implemented
              ? "Serviço implementado mas offline"
              : "Serviço em desenvolvimento",
          };
        }
      })
    );

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      message: "Teste de conexão com todos os microserviços",
      data: {
        timestamp: new Date().toISOString(),
        total_test_time: `${totalTime}ms`,
        gateway: "online",
        microservices: connectionResults,
        summary: {
          total: connectionResults.length,
          online: connectionResults.filter((s) => s.status === "online").length,
          offline: connectionResults.filter((s) => s.status === "offline")
            .length,
          not_implemented: connectionResults.filter(
            (s) => s.status === "not_implemented"
          ).length,
          implemented: connectionResults.filter((s) => s.implemented).length,
        },
        environment: process.env.NODE_ENV || "development",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao testar conexões com microserviços",
      error: error.message,
    });
  }
});

// 🔍 Teste de CONEXÃO ESPECÍFICA com AUTH-USERS-SERVICE
router.get("/test/auth-service-connection", async (req, res) => {
  const startTime = Date.now();

  try {
    // Testa conexão direta com o serviço de autenticação
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      "https://auth-users-service.onrender.com/health",
      {
        method: "GET",
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const responseData = await response.json().catch(() => ({}));

    res.json({
      success: true,
      message: "Teste específico de conexão com Auth Users Service",
      data: {
        timestamp: new Date().toISOString(),
        service: "AUTH-USERS-SERVICE",
        status: response.ok ? "online" : "offline",
        response_time: `${responseTime}ms`,
        http_status: response.status,
        url: "https://auth-users-service.onrender.com/health",
        response_data: responseData,
        performance:
          responseTime < 1000
            ? "excellent"
            : responseTime < 3000
            ? "good"
            : responseTime < 5000
            ? "acceptable"
            : "slow",
      },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      message: "Falha na conexão com Auth Users Service",
      data: {
        timestamp: new Date().toISOString(),
        service: "AUTH-USERS-SERVICE",
        status: "offline",
        response_time: `${responseTime}ms`,
        error: error.message,
        url: "https://auth-users-service.onrender.com/health",
      },
    });
  }
});

// ⚡ Rota de teste de performance do GATEWAY
router.get("/test/performance", (req, res) => {
  const startTime = Date.now();

  // Simula processamento pesado para testar performance
  const mockData = {
    users: Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      profile: {
        role: i % 3 === 0 ? "admin" : i % 3 === 1 ? "employee" : "client",
        status: i % 5 === 0 ? "inactive" : "active",
      },
    })),
  };

  // Simula algum processamento complexo
  const processedData = mockData.users.map((user) => ({
    ...user,
    processed_at: new Date().toISOString(),
    metadata: {
      name_length: user.name.length,
      email_domain: user.email.split("@")[1],
      role_priority:
        user.profile.role === "admin"
          ? 1
          : user.profile.role === "employee"
          ? 2
          : 3,
    },
  }));

  const endTime = Date.now();
  const processingTime = endTime - startTime;

  res.json({
    success: true,
    message: "Teste de performance do Gateway",
    data: {
      timestamp: new Date().toISOString(),
      processing_time: `${processingTime}ms`,
      data_size: `${JSON.stringify(mockData).length} bytes`,
      items_processed: processedData.length,
      memory_usage: `${Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      )}MB`,
      performance:
        processingTime < 50
          ? "excellent"
          : processingTime < 100
          ? "good"
          : processingTime < 200
          ? "acceptable"
          : "slow",
      system_info: {
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: `${Math.round(process.uptime())}s`,
      },
    },
  });
});

export default router;
