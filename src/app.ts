// gateway/src/config/server.ts
import express from "express";
import cors from "cors";
import chalk from "chalk";
import helmet from "helmet";
import gatewayRoutes from "./routes/gateway.routes";
import { globalRateLimit } from "./middleware/rate-limiting.middleware";
import { connectDatabase } from "./config/database";
import { gatewayLogger } from "./middleware/gatewayLogger";

const app = express();

const getTimestamp = () => chalk.gray(`[${new Date().toISOString()}]`);

// ✅ CONECTAR AO MONGODB
connectDatabase().catch((error) => {
  console.error(
    `${getTimestamp()} ${chalk.red("❌")} Failed to connect to MongoDB:`,
    error
  );
});

// =============================================
// 🎯 ORDEM CORRETA DOS MIDDLEWARES - ATUALIZADA
// =============================================

// ✅ 1. SEGURANÇA PRIMEIRO
app.use(helmet());

// ✅ 2. CORS (deve vir antes do body parsing)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "https://beautytimeplatformapp.netlify.app",
 "http://localhost:9000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ 3. BODY PARSING (CRÍTICO - deve vir ANTES de qualquer middleware que use req.body)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ 4. RATE LIMITING (usa req.body)
app.use(globalRateLimit);

// ✅ 5. LOGGING PARA MONGODB (usa req.body - deve vir DEPOIS do body parsing)
app.use(gatewayLogger);

// ✅ 6. MIDDLEWARE DE DEBUG TEMPORÁRIO (remover depois que funcionar)
app.use((req, res, next) => {
  console.log("🔍 [DEBUG MIDDLEWARE] Body parsing verification:");
  console.log("🔍 [DEBUG] req.body type:", typeof req.body);
  console.log("🔍 [DEBUG] req.body keys:", Object.keys(req.body));
  console.log(
    "🔍 [DEBUG] req.body content:",
    JSON.stringify(req.body).substring(0, 500)
  );
  console.log("🔍 [DEBUG] Content-Type:", req.headers["content-type"]);
  console.log("🔍 [DEBUG] Content-Length:", req.headers["content-length"]);
  next();
});

// ✅ 7. LOGGER CONSOLE MELHORADO (usa req.body - deve vir DEPOIS do body parsing)
app.use((req, res, next) => {
  const start = Date.now();

  console.log(`${getTimestamp()} ${chalk.blue(req.method)} ${req.path}`);

  // ✅ AGORA O BODY DEVE ESTAR DISPONÍVEL AQUI
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(
      `${getTimestamp()} ${chalk.yellow("📦 BODY:")}`,
      JSON.stringify(req.body, null, 2)
    );
  } else {
    console.log(`${getTimestamp()} ${chalk.gray("📦 BODY:")}`, "{}");
  }

  // ✅ LOG HEADERS (seguro)
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization)
    safeHeaders.authorization = "Bearer [REDACTED]";
  if (safeHeaders.cookie) safeHeaders.cookie = "[REDACTED]";

  console.log(
    `${getTimestamp()} ${chalk.magenta("📋 HEADERS:")}`,
    JSON.stringify(safeHeaders, null, 2)
  );

  // Interceptar resposta
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody: any;

  res.send = function (body: any): any {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.json = function (body: any): any {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? chalk.red : chalk.green;

    console.log(
      `${getTimestamp()} ${statusColor("✅")} ${req.method} ${req.path} - ${
        res.statusCode
      } (${duration}ms)`
    );

    if (responseBody && duration > 100) {
      try {
        const responseStr =
          typeof responseBody === "string"
            ? responseBody
            : JSON.stringify(responseBody);
        if (responseStr.length < 1000) {
          console.log(
            `${getTimestamp()} ${chalk.green("📤 RESPONSE:")}`,
            responseStr
          );
        } else {
          console.log(
            `${getTimestamp()} ${chalk.green("📤 RESPONSE:")}`,
            responseStr.substring(0, 500) + "..."
          );
        }
      } catch (e) {
        console.log(
          `${getTimestamp()} ${chalk.green("📤 RESPONSE:")}`,
          "[UNSERIALIZABLE]"
        );
      }
    }

    // ✅ LOG DE REQUISIÇÃO LENTA
    if (duration > 3000) {
      console.log(
        `${getTimestamp()} ${chalk.red("🐌 REQUISIÇÃO LENTA:")} ${duration}ms`
      );
    }
  });

  next();
});

// ✅ 8. ROTAS (ÚLTIMO)
app.use("/", gatewayRoutes);

// =============================================
// 🏠 ROTAS DO GATEWAY
// =============================================

// ✅ HEALTH CHECK (atualizado para incluir MongoDB)
app.get("/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus =
    mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED";

  res.json({
    status: "OK",
    service: "Gateway",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: dbStatus,
    correlation_id: req.headers["x-correlation-id"] || "none",
    version: "2.4.1", // 🆕 ATUALIZADO
  });
});

// ✅ STATUS DOS SERVIÇOS
app.get("/status", (req, res) => {
  const services = [
    {
      name: "AUTH_USERS_SERVICE",
      url: process.env.AUTH_USERS_SERVICE_URL || "http://localhost:3001",
    },
    {
      name: "SCHEDULING_SERVICE",
      url: process.env.SCHEDULING_SERVICE_URL || "http://localhost:3002",
    },
    {
      name: "EMPLOYEES_SERVICE",
      url: process.env.EMPLOYEES_SERVICE_URL || "http://localhost:3003",
    },
    {
      name: "SALONS_SERVICE",
      url: process.env.SALONS_SERVICE_URL || "http://localhost:3004",
    },
    {
      name: "PAYMENTS_SERVICE",
      url: process.env.PAYMENTS_SERVICE_URL || "http://localhost:3005",
    },
    {
      name: "NOTIFICATIONS_SERVICE",
      url: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3006",
    },
    {
      name: "ANALYTICS_SERVICE",
      url: process.env.ANALYTICS_SERVICE_URL || "http://localhost:3007",
    },
    {
      name: "ADMIN_SERVICE",
      url: process.env.ADMIN_SERVICE_URL || "http://localhost:3008",
    },
  ];

  res.json({
    gateway: "RUNNING",
    timestamp: new Date().toISOString(),
    database: "MongoDB Logging Enabled",
    correlation_id: req.headers["x-correlation-id"] || "none",
    version: "2.4.1", // 🆕 ATUALIZADO
    features: [
      "body_parsing_fixed",
      "mongodb_logging",
      "rate_limiting",
      "cors_enabled",
      "service_discovery",
    ],
    services: services.map((service) => ({
      name: service.name,
      url: service.url,
      status: service.url.includes("localhost")
        ? "CONFIGURED"
        : "NOT_CONFIGURED",
    })),
  });
});

// ✅ ROTA RAIZ
app.get("/", (req, res) => {
  res.json({
    message: "Gateway Service",
    status: "running",
    timestamp: new Date().toISOString(),
    version: "2.4.1", // 🆕 ATUALIZADO
    database: "MongoDB Logging Active",
    correlation_id: req.headers["x-correlation-id"] || "none",
    features: [
      "Enhanced body parsing",
      "MongoDB request logging",
      "Rate limiting",
      "CORS enabled",
      "Service health monitoring",
    ],
  });
});

// =============================================
// ❌ ERROR HANDLING
// =============================================

// ✅ 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    correlation_id: req.headers["x-correlation-id"] || "none",
    gateway_version: "2.4.1", // 🆕 ATUALIZADO
    available_endpoints: [
      "GET /health",
      "GET /status",
      "POST /auth/*",
      "POST /clients/*",
      "POST /employees/*",
      "POST /admins/*",
      "POST /verify/*",
      "POST /otp/*",
      "POST /cleanup/*",
    ],
  });
});

// ✅ ERROR HANDLER GLOBAL
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(`${getTimestamp()} ${chalk.red("💥 GATEWAY ERROR:")}`, error);

    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      correlation_id: req.headers["x-correlation-id"] || "none",
      timestamp: new Date().toISOString(),
      gateway_version: "2.4.1", // 🆕 ATUALIZADO
    });
  }
);

export default app;
