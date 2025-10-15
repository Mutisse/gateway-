import { Router } from "express";
import { httpClient } from "../utils/http-client";

const router = Router();

// 🩺 HEALTH CHECKS & MONITORING
router.get("/user-service/health", async (req, res, next) => {
  try {
    console.log("🩺 Gateway: Health check do User Service");
    const response = await httpClient.get("AUTH_USERS_SERVICE", "/health");
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(
      "❌ Gateway: Erro no health check do User Service:",
      error.message
    );
    next(error);
  }
});

router.get("/ping/users", async (req, res, next) => {
  try {
    console.log("📡 Gateway: Ping para User Service");
    const startTime = Date.now();

    const response = await httpClient.get("AUTH_USERS_SERVICE", "/health");
    const responseTime = Date.now() - startTime;

    res.status(response.status).json({
      success: true,
      message: "✅ Ping para User Service bem-sucedido!",
      data: {
        service: "user-service",
        status: "online",
        response_time: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        performance:
          responseTime < 1000
            ? "excellent"
            : responseTime < 3000
            ? "good"
            : "slow",
      },
    });
  } catch (error: any) {
    console.error("❌ Gateway: Erro no ping para User Service:", error.message);
    res.status(503).json({
      success: false,
      message: "❌ User Service offline",
      data: {
        service: "user-service",
        status: "offline",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 🧪 TEST ROUTES
router.get("/test/auth-service-connection", async (req, res, next) => {
  try {
    console.log("🧪 Gateway: Teste de conexão com Auth Service");

    // ✅ CORRIGIDO: Interface para os testes
    interface TestResult {
      status: string;
      response_time?: string;
      data?: any;
      error?: string;
    }

    const tests: {
      health_check: TestResult | null;
      main_endpoint: TestResult | null;
      database_status: TestResult | null;
    } = {
      health_check: null,
      main_endpoint: null,
      database_status: null,
    };

    // Test 1: Health Check
    try {
      const healthResponse = await httpClient.get(
        "AUTH_USERS_SERVICE",
        "/health"
      );
      tests.health_check = {
        status: "✅ OK",
        response_time: "healthy",
        data: healthResponse.data,
      };
    } catch (error: any) {
      tests.health_check = {
        status: "❌ FAILED",
        error: error.message,
      };
    }

    // Test 2: Main Endpoint
    try {
      const mainResponse = await httpClient.get("AUTH_USERS_SERVICE", "/");
      tests.main_endpoint = {
        status: "✅ OK",
        response_time: "responsive",
        data: mainResponse.data,
      };
    } catch (error: any) {
      tests.main_endpoint = {
        status: "❌ FAILED",
        error: error.message,
      };
    }

    // Test 3: Database Status
    try {
      const dbResponse = await httpClient.get(
        "AUTH_USERS_SERVICE",
        "/UserService/database-status"
      );
      tests.database_status = {
        status: "✅ OK",
        response_time: "connected",
        data: dbResponse.data,
      };
    } catch (error: any) {
      tests.database_status = {
        status: "❌ FAILED",
        error: error.message,
      };
    }

    res.json({
      success: true,
      message: "Teste de conexão com Auth Service completo",
      data: {
        service: "auth-users-service",
        timestamp: new Date().toISOString(),
        tests,
      },
    });
  } catch (error: any) {
    console.error("❌ Gateway: Erro no teste de conexão:", error.message);
    next(error);
  }
});

// 📊 SERVICE INFO & STATUS
router.get("/user-service/info", async (req, res, next) => {
  try {
    console.log("📊 Gateway: Obtendo info do User Service");
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/UserService/info"
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(
      "❌ Gateway: Erro ao obter info do User Service:",
      error.message
    );
    next(error);
  }
});

router.get("/user-service/status", async (req, res, next) => {
  try {
    console.log("📈 Gateway: Obtendo status completo do User Service");

    const [healthResponse, infoResponse] = await Promise.allSettled([
      httpClient.get("AUTH_USERS_SERVICE", "/health"),
      httpClient.get("AUTH_USERS_SERVICE", "/UserService/info"),
    ]);

    // ✅ CORRIGIDO: Interface para o status
    interface ServiceStatus {
      service: string;
      timestamp: string;
      health: string;
      info: string;
      details: {
        health: any;
        info: any;
      };
    }

    const status: ServiceStatus = {
      service: "auth-users-service",
      timestamp: new Date().toISOString(),
      health: healthResponse.status === "fulfilled" ? "healthy" : "unhealthy",
      info: infoResponse.status === "fulfilled" ? "available" : "unavailable",
      details: {
        health:
          healthResponse.status === "fulfilled"
            ? healthResponse.value.data
            : null,
        info:
          infoResponse.status === "fulfilled" ? infoResponse.value.data : null,
      },
    };

    res.json({
      success: true,
      message: "Status do User Service obtido com sucesso",
      data: status,
    });
  } catch (error: any) {
    console.error(
      "❌ Gateway: Erro ao obter status do User Service:",
      error.message
    );
    next(error);
  }
});

// 🔄 GATEWAY COMMUNICATION TEST
router.get("/user-service/gateway-test", async (req, res, next) => {
  try {
    console.log("🔄 Gateway: Teste de comunicação Gateway → User Service");
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/UserService/gateway-test"
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no teste de comunicação:", error.message);
    next(error);
  }
});

router.get("/user-service/ping-gateway", async (req, res, next) => {
  try {
    console.log("📡 Gateway: User Service pingando de volta para Gateway");
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/UserService/ping-gateway"
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no ping de retorno:", error.message);
    next(error);
  }
});

export default router;
