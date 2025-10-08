"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const chalk_1 = __importDefault(require("chalk"));
const app_1 = __importDefault(require("./app"));
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";
// Configuração do logger com chalk
const log = {
    info: (message, meta) => console.log(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.blue(message), meta ? chalk_1.default.gray(JSON.stringify(meta)) : ''),
    error: (message, error) => console.error(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.red(message), error ? chalk_1.default.red(error instanceof Error ? error.message : JSON.stringify(error)) : ''),
    success: (message) => console.log(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.green(message))
};
async function startServer() {
    const server = app_1.default.listen(PORT, HOST, () => {
        log.success(`🚀 Gateway rodando em http://${HOST}:${PORT}`);
        log.info("Ambiente:", process.env.NODE_ENV || "development");
    });
    // Configurações de timeout para conexões persistentes
    server.keepAliveTimeout = 60000; // 60 segundos
    server.headersTimeout = 65000; // 65 segundos
    // Manipuladores de eventos do servidor
    server.on("error", (error) => {
        if (error.syscall !== "listen")
            throw error;
        switch (error.code) {
            case "EACCES":
                log.error(`Porta ${PORT} requer privilégios elevados`);
                process.exit(1);
                break;
            case "EADDRINUSE":
                log.error(`Porta ${PORT} já está em uso`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
    // Manipuladores de eventos de processo
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("unhandledRejection", (reason) => {
        log.error("Rejeição não tratada:", reason);
    });
    process.on("uncaughtException", (error) => {
        log.error("Exceção não capturada:", error);
        shutdown("UNCAUGHT_EXCEPTION");
    });
    // Função de desligamento gracioso
    function shutdown(signal) {
        log.info(`Recebido ${signal}. Encerrando servidor...`);
        server.close((err) => {
            if (err) {
                log.error("Erro ao encerrar servidor:", err);
                process.exit(1);
            }
            log.success("Servidor encerrado com sucesso");
            process.exit(0);
        });
        // Forçar encerramento se demorar muito
        setTimeout(() => {
            log.error("Forçando encerramento...");
            process.exit(1);
        }, 10000);
    }
}
startServer().catch(error => {
    log.error("Falha ao iniciar o gateway:", error);
    process.exit(1);
});
