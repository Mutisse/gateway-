"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const chalk_1 = __importDefault(require("chalk"));
const index_route_1 = __importDefault(require("./routes/index.route"));
const app = (0, express_1.default)();
// Configuração do logger com chalk
const log = {
    info: (message, meta) => console.log(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.blue(message), meta ? chalk_1.default.gray(JSON.stringify(meta)) : ''),
    error: (message, error) => console.error(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.red(message), error ? chalk_1.default.red(error instanceof Error ? error.message : JSON.stringify(error)) : '')
};
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());
// Configuração de CORS melhorada
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
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
app.use(express_1.default.json({ limit: process.env.MAX_REQUEST_SIZE || "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
// Morgan configurado para desenvolvimento
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)((tokens, req, res) => {
        const status = tokens.status(req, res);
        const statusColor = status >= 400 ? chalk_1.default.red : status >= 300 ? chalk_1.default.yellow : chalk_1.default.green;
        return [
            chalk_1.default.gray(`[${new Date().toISOString()}]`),
            chalk_1.default.blue(tokens.method(req, res)),
            tokens.url(req, res),
            statusColor(status),
            chalk_1.default.magenta(tokens['response-time'](req, res) + 'ms'),
            chalk_1.default.cyan(tokens.res(req, res, 'content-length') + 'b')
        ].join(' ');
    }));
}
// Prefixo /api para todas as rotas
app.use("/", index_route_1.default);
// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found",
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});
// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    log.error("Erro no gateway:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});
exports.default = app;
