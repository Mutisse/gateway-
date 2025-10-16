import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import chalk from "chalk";

// ✅ IMPORTAR RATE LIMITING DO ARQUIVO SEPARADO
import {
  apiRateLimit,
  authRateLimit,
  otpRateLimit,
  emailCheckRateLimit,
  rateLimitLogger,
} from "./middleware/rate-limiting.middleware";

// Importar rotas
import routes from "./routes/index.route";
import { serviceCommunicator } from "./utils/service-communicator";

const app = express();

// ✅ SOLUÇÃO CRÍTICA: CONFIGURAR TRUST PROXY PARA RENDER.COM
app.set("trust proxy", 1); // Confia no primeiro proxy

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

// ✅ ORIGENS PERMITIDAS - ATUALIZADA E COMPLETA
const allowedOrigins = [
  "https://beautytimeplatformapp.netlify.app",
  "https://beautytime-frontend.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://gateway-6rov.onrender.com",
  "https://beautytime-platform.vercel.app",
];

// ✅ CORS CONFIGURADO CORRETAMENTE - SOLUÇÃO DEFINITIVA
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // ✅ PERMITIR REQUISIÇÕES SEM ORIGIN
    if (!origin) {
      return callback(null, true);
    }

    // ✅ EM DESENVOLVIMENTO, PERMITIR TODAS AS ORIGENS
    if (process.env.NODE_ENV === "development") {
      log.info("🔓 Desenvolvimento: CORS permitido para:", origin);
      return callback(null, true);
    }

    // ✅ VERIFICAR SE A ORIGEM ESTÁ NA LISTA DE PERMITIDAS
    if (allowedOrigins.includes(origin)) {
      log.info("✅ CORS permitido para:", origin);
      return callback(null, true);
    }

    // ✅ VERIFICAR DOMÍNIOS CONHECIDOS
    const isNetlifyDomain = origin.includes("netlify.app");
    const isVercelDomain = origin.includes("vercel.app");
    const isLocalhost =
      origin.includes("localhost") || origin.includes("127.0.0.1");
    const isRenderDomain = origin.includes("render.com");

    if (isNetlifyDomain || isVercelDomain || isLocalhost || isRenderDomain) {
      log.info("✅ Domínio conhecido permitido:", origin);
      return callback(null, true);
    }

    // ❌ BLOQUEAR ORIGENS NÃO PERMITIDAS
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
    "X-API-Key",
  ],
  exposedHeaders: ["x-request-id", "x-total-count", "x-page", "x-per-page"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// ✅ MIDDLEWARE CORS GLOBAL - APLICAR ANTES DE TUDO
app.use(cors(corsOptions));

// ✅ APLICAR RATE LIMITING GLOBAL (DO ARQUIVO SEPARADO)
app.use(apiRateLimit);

// ✅ APLICAR LOGGER DE RATE LIMITING
app.use(rateLimitLogger);

// ✅ MIDDLEWARE PARA TRATAR REQUISIÇÕES OPTIONS (PREFLIGHT) GLOBALMENTE
app.options("*", cors(corsOptions));

// ✅ MIDDLEWARE PERSONALIZADO PARA HEADERS CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Adicionar headers CORS para todas as respostas
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (origin && process.env.NODE_ENV === "development") {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Requested-With"
  );

  // ✅ TRATAR REQUISIÇÕES OPTIONS (PREFLIGHT) IMEDIATAMENTE
  if (req.method === "OPTIONS") {
    log.info("🛫 Preflight OPTIONS request para:", req.path);
    return res.status(200).end();
  }

  next();
});

// Middlewares essenciais
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

// Morgan configurado
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

// ✅ MIDDLEWARE PARA LOGS DETALHADOS
app.use((req, res, next) => {
  log.info(`📨 ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    ip: req.ip,
    userAgent: req.headers["user-agent"]?.substring(0, 50),
  });
  next();
});

// 🏠 Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "beautytime-gateway",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    trustProxy: app.get("trust proxy"),
    allowedOrigins: allowedOrigins,
    cors: {
      enabled: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    },
    rateLimiting: {
      enabled: true,
      environment: process.env.NODE_ENV,
      config: "Ver /api/debug/rate-limit-info para detalhes",
    },
  });
});

// 🎯 ENDPOINT PARA VERIFICAR CORS
app.get("/api/cors-info", (req, res) => {
  const origin = req.headers.origin;
  const isAllowed = origin ? allowedOrigins.includes(origin) : false;

  res.status(200).json({
    success: true,
    data: {
      yourOrigin: origin,
      isAllowed: isAllowed,
      allowedOrigins: allowedOrigins,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// 🎯 ENDPOINT DE TESTE CORS PARA POST
app.post("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "✅ CORS POST funcionando corretamente!",
    data: {
      origin: req.headers.origin,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
    },
  });
});

// 🎯 ENDPOINT PARA DEBUG DO PROXY/RATE LIMIT
app.get("/api/debug/proxy-info", (req, res) => {
  res.json({
    success: true,
    data: {
      ip: req.ip,
      ips: req.ips,
      originalIp: req.headers["x-forwarded-for"],
      realIp: req.headers["x-real-ip"],
      trustProxy: app.get("trust proxy"),
      headers: {
        "x-forwarded-for": req.headers["x-forwarded-for"],
        "x-real-ip": req.headers["x-real-ip"],
        "user-agent": req.headers["user-agent"]?.substring(0, 50),
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
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

// ✅ APLICAR RATE LIMITING ESPECÍFICO NAS ROTAS (DO ARQUIVO SEPARADO)
app.use("/api/Auth/check-email", emailCheckRateLimit); // ✅ MAIS PERMISSIVO
app.use("/api/Auth/login", authRateLimit);
app.use("/api/Auth/register", authRateLimit);
app.use("/api/OTP/send", otpRateLimit);
app.use("/api/OTP/verify", otpRateLimit);

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
        suggestion: "Verifique se a origem está na lista de origens permitidas",
      });
    }

    // ✅ TRATAMENTO ESPECÍFICO PARA RATE LIMITING
    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Muitas requisições. Tente novamente mais tarde.",
        timestamp: new Date().toISOString(),
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: "15 minutos",
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

// ✅ EXPORT PARA VARIÁVEIS DE AMBIENTE
export { allowedOrigins, corsOptions };

export default app;
