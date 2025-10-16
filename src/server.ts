import "dotenv/config";
import chalk from "chalk";
import app from "./app";

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
  warning: (message: string) =>
    console.log(
      chalk.gray(`[${new Date().toISOString()}]`),
      chalk.yellow(message)
    ),
};

// 🎯 FUNÇÃO PARA ENCONTRAR PORTA DISPONÍVEL
const encontrarPortaDisponivel = (
  portaInicial: number,
  maxTentativas: number = 10
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const net = require("net");

    const tentarPorta = (porta: number, tentativa: number) => {
      if (tentativa > maxTentativas) {
        reject(
          new Error(
            `Não encontrou porta disponível após ${maxTentativas} tentativas`
          )
        );
        return;
      }

      const servidorTeste = net.createServer();

      servidorTeste.listen(porta, () => {
        servidorTeste.close(() => {
          resolve(porta);
        });
      });

      servidorTeste.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          log.warning(`Porta ${porta} ocupada, tentando ${porta + 1}...`);
          tentarPorta(porta + 1, tentativa + 1);
        } else {
          reject(err);
        }
      });
    };

    tentarPorta(portaInicial, 1);
  });
};

async function startServer() {
  const PORTA_PADRAO = Number(process.env.PORT) || 8080;
  const HOST = process.env.HOST || "0.0.0.0";

  try {
    // 🎯 TENTAR ENCONTRAR PORTA DISPONÍVEL
    const portaDisponivel = await encontrarPortaDisponivel(PORTA_PADRAO);

    const server = app.listen(portaDisponivel, HOST, () => {
      // ✅ CORREÇÃO: Usar portaDisponivel em vez de PORT
      console.log(`
📊 ENDPOINTS DISPONÍVEIS:

🏠 ROTAS PRINCIPAIS
   ❤️  Health: http://localhost:${portaDisponivel}/api/health
   🏠 Welcome: http://localhost:${portaDisponivel}/
   ℹ️  API Info: http://localhost:${portaDisponivel}/api/info
   📊 API Status: http://localhost:${portaDisponivel}/api/status

🩺 DIAGNÓSTICO GATEWAY
   🔍 Gateway Status: http://localhost:${portaDisponivel}/api/diagnostic/gateway-status
   ⚡ Performance: http://localhost:${portaDisponivel}/api/diagnostic/gateway-performance
   ⚙️ Configuração: http://localhost:${portaDisponivel}/api/diagnostic/gateway-config
   📋 Rotas: http://localhost:${portaDisponivel}/api/diagnostic/gateway-routes

👤 USER SERVICE
   🩺 Health: http://localhost:${portaDisponivel}/api/user-service/health
   📡 Ping: http://localhost:${portaDisponivel}/api/ping/users
   🧪 Teste Conexão: http://localhost:${portaDisponivel}/api/test/auth-service-connection
   📊 Info: http://localhost:${portaDisponivel}/api/user-service/info

🔐 AUTENTICAÇÃO
   👤 Registro: http://localhost:${portaDisponivel}/api/auth/register
   🔐 Login: http://localhost:${portaDisponivel}/api/auth/login
   📧 OTP Send: http://localhost:${portaDisponivel}/api/otp/send
   ✅ OTP Verify: http://localhost:${portaDisponivel}/api/otp/verify

🎯 DEBUG
   🔍 Proxy Info: http://localhost:${portaDisponivel}/api/debug/proxy-info
   🌐 CORS Info: http://localhost:${portaDisponivel}/api/cors-info

`);
      console.log(
        `\n🚀 ${chalk.green("Gateway pronto para receber requisições!")}\n`
      );
    });

    // Configurações de timeout para conexões persistentes
    server.keepAliveTimeout = 60000; // 60 segundos
    server.headersTimeout = 65000; // 65 segundos

    // Manipuladores de eventos do servidor
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") throw error;

      switch (error.code) {
        case "EACCES":
          log.error(`Porta ${portaDisponivel} requer privilégios elevados`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          log.error(`Porta ${portaDisponivel} já está em uso`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Manipuladores de eventos de processo
    process.on("SIGINT", () => shutdown("SIGINT", server));
    process.on("SIGTERM", () => shutdown("SIGTERM", server));
    process.on("unhandledRejection", (reason) => {
      log.error("Rejeição não tratada:", reason);
    });
    process.on("uncaughtException", (error) => {
      log.error("Exceção não capturada:", error);
      shutdown("UNCAUGHT_EXCEPTION", server);
    });

    return server;
  } catch (error: any) {
    log.error("Falha ao iniciar servidor:", error.message);
    console.log(`\n💡 ${chalk.yellow("Soluções:")}`);
    console.log(`   1. ${chalk.cyan("Mude a porta no .env:")} PORT=8081`);
    console.log(`   2. ${chalk.cyan("Execute:")} netstat -ano | findstr :8080`);
    console.log(`   3. ${chalk.cyan("Execute:")} taskkill /PID <NUMERO> /F`);
    console.log(`   4. ${chalk.cyan("Reinicie o computador")}`);
    process.exit(1);
  }
}

// Função de desligamento gracioso
function shutdown(signal: string, server: any) {
  log.info(`Recebido ${signal}. Encerrando servidor...`);

  server.close((err: any) => {
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

startServer().catch((error) => {
  log.error("Falha ao iniciar o gateway:", error);
  process.exit(1);
});
