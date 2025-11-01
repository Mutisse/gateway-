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
// 🎯 ORDEM CORRETA DOS MIDDLEWARES - CORRIGIDA
// =============================================

// ✅ 1. SEGURANÇA PRIMEIRO
app.use(helmet());

// ✅ 2. CORS COMPLETO E CORRETO
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "https://beautytimeplatformapp.netlify.app",
  "http://localhost:9000",
  "http://localhost:3000", // ✅ ADICIONAR para desenvolvimento
];

app.use(
  cors({
    origin: (origin, callback) => {
      // ✅ Permitir requisições sem origin (mobile apps, postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(
          `${getTimestamp()} ${chalk.yellow("🚫 CORS Blocked:")}`,
          origin
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Content-Length", "X-Request-ID"],
    maxAge: 86400, // 24 horas
  })
);

// ✅ 3. HANDLE OPTIONS REQUESTS PARA PREFLIGHT
app.options("*", cors()); // ✅ CRÍTICO: habilita preflight para todas as rotas

// ✅ 4. BODY PARSING
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ 5. RATE LIMITING
app.use(globalRateLimit);

// ✅ 6. LOGGING PARA MONGODB
app.use(gatewayLogger);

// ✅ 7. MIDDLEWARE DE DEBUG (MOVido para DEPOIS do CORS)
app.use((req, res, next) => {
  console.log("🔍 [DEBUG MIDDLEWARE] CORS Headers Check:");
  console.log("🔍 [DEBUG] Origin:", req.headers.origin);
  console.log("🔍 [DEBUG] Method:", req.method);
  console.log("🔍 [DEBUG] Path:", req.path);

  // ✅ Verificar headers CORS
  console.log("🔍 [DEBUG] CORS Headers Sent:");
  res.on("finish", () => {
    console.log("🔍 [DEBUG CORS RESPONSE]:");
    console.log(
      "🔍 Access-Control-Allow-Origin:",
      res.getHeader("Access-Control-Allow-Origin")
    );
    console.log(
      "🔍 Access-Control-Allow-Methods:",
      res.getHeader("Access-Control-Allow-Methods")
    );
    console.log(
      "🔍 Access-Control-Allow-Headers:",
      res.getHeader("Access-Control-Allow-Headers")
    );
  });

  next();
});

// ✅ 8. LOGGER CONSOLE MELHORADO
app.use((req, res, next) => {
  const start = Date.now();

  console.log(`${getTimestamp()} ${chalk.blue(req.method)} ${req.path}`);
  console.log(
    `${getTimestamp()} ${chalk.cyan("🌐 Origin:")}`,
    req.headers.origin
  );

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(
      `${getTimestamp()} ${chalk.yellow("📦 BODY:")}`,
      JSON.stringify(req.body, null, 2)
    );
  }

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
  });

  next();
});

// ✅ 9. ROTAS (ÚLTIMO)
app.use("/", gatewayRoutes);

// =============================================
// 🏠 ROTAS DO GATEWAY
// =============================================

// ✅ HEALTH CHECK
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
    cors: {
      enabled: true,
      allowed_origins: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    },
    version: "2.4.2", // 🆕 ATUALIZADO com correção CORS
  });
});

// ... resto do código permanece igual

// =============================================
// ❌ ERROR HANDLING MELHORADO
// =============================================

// ✅ ERROR HANDLER GLOBAL com CORS
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(`${getTimestamp()} ${chalk.red("💥 GATEWAY ERROR:")}`, error);

    // ✅ GARANTIR que headers CORS sejam enviados mesmo em erro
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );

    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      correlation_id: req.headers["x-correlation-id"] || "none",
      timestamp: new Date().toISOString(),
      gateway_version: "2.4.2", // 🆕 ATUALIZADO
    });
  }
);

export default app;
