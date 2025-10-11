import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import chalk from "chalk";
import rateLimit from "express-rate-limit";

// Importar rotas
import routes from "./routes/index.route";
import { serviceCommunicator } from "./utils/service-communicator";

const app = express();

// Configuração do logger com chalk
const log = {
  info: (message: string, meta?: any) =>
    console.log(
      chalk.gray(`[${new Date().toISOString()}]`),
      chalk.blue(message),
      meta ? chalk.gray(JSON.stringify(meta)) : ""
    ),
  error: (message: string, error?: any) =>
    console.error(
      chalk.gray(`[${new Date().toISOString()}]`),
      chalk.red(message),
      error
        ? chalk.red(
            error instanceof Error ? error.message : JSON.stringify(error)
          )
        : ""
    ),
  success: (message: string) =>
    console.log(
      chalk.gray(`[${new Date().toISOString()}]`),
      chalk.green(message)
    ),
};

// ✅ ORIGENS PERMITIDAS
const allowedOrigins = [
  "http://localhost:9000",
  "https://beautytime-frontend.netlify.app",
  "http://localhost:3000", // Adicionado para desenvolvimento
  "http://localhost:8080", // Gateway itself
];

// ✅ CORS CONFIGURADO CORRETAMENTE
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Permitir requisições sem origin (mobile apps, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar se a origem está na lista de permitidas
    if (allowedOrigins.includes(origin)) {
      log.info("✅ CORS permitido para:", origin);
      return callback(null, true);
    }

    // Bloquear todas as outras origens
    log.error("❌ CORS bloqueado para origem não permitida:", origin);
    callback(new Error(`Origem ${origin} não permitida por CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-request-id",
    "X-Service-Name",
    "X-Forwarded-For",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["x-request-id"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// ✅ APLIQUE O CORS APENAS UMA VEZ
app.use(cors(corsOptions));

// 🎯 RATE LIMITING
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    success: false,
    error: "Muitas requisições, tente novamente mais tarde",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalRateLimit);

// Middlewares essenciais
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

// Morgan configurado para desenvolvimento
app.use(
  morgan(((tokens: any, req: any, res: any) => {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens["response-time"](req, res);

    const statusColor =
      status >= 400 ? chalk.red : status >= 300 ? chalk.yellow : chalk.green;

    return [
      chalk.blue(method),
      url,
      statusColor(status),
      "-",
      chalk.gray(`${responseTime}ms`),
    ].join(" ");
  }) as any)
);

// ✅ MIDDLEWARE PARA LOGS DETALHADOS (apenas desenvolvimento)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    log.info(`📨 ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      ip: req.ip,
    });
    next();
  });
}

// 🏠 Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "beautytime-gateway",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    allowedOrigins: allowedOrigins,
  });
});

// 🎯 NOVAS ROTAS DE DIAGNÓSTICO
app.get("/api/services/health", async (req, res) => {
  try {
    log.info("🔍 Verificando saúde de todos os serviços...");

    const servicesHealth = await serviceCommunicator.checkAllServicesHealth();

    const allHealthy = servicesHealth.every(
      (service) => service.status === "healthy"
    );
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json({
      success: allHealthy,
      message: allHealthy
        ? "Todos os serviços estão saudáveis"
        : "Alguns serviços estão com problemas",
      data: {
        services: servicesHealth,
        summary: {
          total: servicesHealth.length,
          healthy: servicesHealth.filter((s) => s.status === "healthy").length,
          unhealthy: servicesHealth.filter((s) => s.status === "unhealthy")
            .length,
          unknown: servicesHealth.filter((s) => s.status === "unknown").length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    log.error("❌ Erro ao verificar saúde dos serviços:", error);

    res.status(500).json({
      success: false,
      error: "Erro interno ao verificar serviços",
      details: error.message,
    });
  }
});

// 🎯 PING PARA USER SERVICE
app.get("/api/ping/users", async (req, res) => {
  try {
    log.info("🔍 Fazendo ping para User Service...");

    const health = await serviceCommunicator.checkServiceHealth(
      "AUTH_USERS_SERVICE"
    );

    if (health.status === "healthy") {
      res.json({
        success: true,
        message: "✅ User Service está respondendo normalmente",
        data: health,
      });
    } else {
      res.status(503).json({
        success: false,
        error: "❌ User Service não está disponível",
        data: health,
      });
    }
  } catch (error: any) {
    log.error("❌ Erro no ping para User Service:", error);

    res.status(500).json({
      success: false,
      error: "Erro interno ao verificar User Service",
      details: error.message,
    });
  }
});

// Prefixo /api para todas as rotas
app.use("/", routes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  log.error(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Endpoint não encontrado",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    code: "ROUTE_NOT_FOUND",
  });
});

// Middleware de tratamento de erros
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    log.error("Erro no gateway:", err);

    // ✅ TRATAMENTO ESPECÍFICO PARA ERROS CORS
    if (err.message.includes("CORS")) {
      return res.status(403).json({
        success: false,
        error: "Acesso bloqueado por política de CORS",
        origin: req.headers.origin,
        allowedOrigins: allowedOrigins,
        timestamp: new Date().toISOString(),
        code: "CORS_ERROR",
      });
    }

    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal Server Error",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      code: err.code || "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

export default app;
