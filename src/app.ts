import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import chalk from "chalk";
import routes from "./routes/index.route";

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
};

// ✅ ORIGENS ESPECÍFICAS: Apenas localhost:9000 e Netlify
const allowedOrigins = [
  "http://localhost:9000",
  "https://beautytime-frontend.netlify.app",
];

// ✅ CORS CONFIGURADO CORRETAMENTE
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Permitir requisições sem origin (mobile apps, etc)
    if (!origin) {
      log.info("✅ Requisição sem origin permitida");
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
    "X-Requested-With", // ✅ ADICIONADO
    "Access-Control-Request-Method", // ✅ ADICIONADO
    "Access-Control-Request-Headers", // ✅ ADICIONADO
  ],
  exposedHeaders: ["x-request-id"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // ✅ ADICIONADO: Cache de preflight por 24h
};

// ✅ APLIQUE O CORS APENAS UMA VEZ
app.use(cors(corsOptions));

// ✅ REMOVA ESTA LINHA - já está incluído no cors() acima
// app.options('*', cors());

// Middlewares essenciais
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

// Morgan configurado para desenvolvimento
app.use(
  morgan(((tokens: any, req: any, res: any) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  }) as any)
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: allowedOrigins,
    cors: "configured", // ✅ Confirma que CORS está ativo
  });
});

// ✅ MIDDLEWARE PARA LOGS DETALHADOS DE CORS (apenas desenvolvimento)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    log.info(`📨 ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      "user-agent": req.headers["user-agent"],
    });
    next();
  });
}

// Prefixo /api para todas as rotas
app.use("/", routes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
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
        error: "Acesso bloqueado por política de CORS",
        origin: req.headers.origin,
        allowedOrigins: allowedOrigins,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

export default app;
