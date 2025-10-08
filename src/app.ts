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
  info: (message: string, meta?: any) => console.log(
    chalk.gray(`[${new Date().toISOString()}]`),
    chalk.blue(message),
    meta ? chalk.gray(JSON.stringify(meta)) : ''
  ),
  error: (message: string, error?: any) => console.error(
    chalk.gray(`[${new Date().toISOString()}]`),
    chalk.red(message),
    error ? chalk.red(error instanceof Error ? error.message : JSON.stringify(error)) : ''
  )
};

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

// Configuração de CORS melhorada
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log.error("CORS bloqueado para origem:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-request-id",
    "X-Service-Name",
    "X-Forwarded-For"
  ],
  exposedHeaders: ["x-request-id"]
}));

// Middlewares essenciais
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

// Morgan configurado para desenvolvimento
app.use(morgan((tokens: any, req: Request, res: Response) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
}));

// Prefixo /api para todas as rotas
app.use("/", routes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error("Erro no gateway:", err);
  
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

export default app;