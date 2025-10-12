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
      console.log(
        `\n🎉 ${chalk.green("BeautyTime Gateway iniciado com sucesso!")}`
      );
      console.log(
        `📍 ${chalk.cyan("Porta:")} ${chalk.yellow(portaDisponivel)} ${
          portaDisponivel !== PORTA_PADRAO
            ? chalk.gray(`(original ${PORTA_PADRAO} estava ocupada)`)
            : ""
        }`
      );
      console.log(
        `🌐 ${chalk.cyan("Ambiente:")} ${chalk.yellow(
          process.env.NODE_ENV || "development"
        )}`
      );
      console.log(`🏠 ${chalk.cyan("Host:")} ${chalk.yellow(HOST)}`);

      console.log(`\n📊 ${chalk.cyan("ENDPOINTS DISPONÍVEIS:")}`);

      console.log(`\n${chalk.yellow("🏠 ROTAS PRINCIPAIS")}`);
      console.log(
        `   ❤️  ${chalk.green(
          "Health:"
        )} http://localhost:${portaDisponivel}/health`
      );
      console.log(
        `   🏠 ${chalk.green("Welcome:")} http://localhost:${portaDisponivel}/`
      );
      console.log(
        `   ℹ️  ${chalk.green(
          "API Info:"
        )} http://localhost:${portaDisponivel}/api/info`
      );
      console.log(
        `   📊 ${chalk.green(
          "API Status:"
        )} http://localhost:${portaDisponivel}/api/status`
      );

      console.log(`\n${chalk.yellow("🩺 DIAGNÓSTICO & MONITORAMENTO")}`);
      console.log(
        `   🩺 ${chalk.green(
          "Full Diagnostic:"
        )} http://localhost:${portaDisponivel}/api/diagnostic/full`
      );
      console.log(
        `   🔍 ${chalk.green(
          "Services Health:"
        )} http://localhost:${portaDisponivel}/api/services/health`
      );
      console.log(
        `   📈 ${chalk.green(
          "System Status:"
        )} http://localhost:${portaDisponivel}/api/diagnostic/status`
      );

      console.log(`\n${chalk.yellow("🔄 PING PARA MICROSERVIÇOS")}`);
      console.log(
        `   👥 ${chalk.green(
          "Users Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/users`
      );
      console.log(
        `   📅 ${chalk.green(
          "Scheduling Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/scheduling`
      );
      console.log(
        `   💼 ${chalk.green(
          "Employees Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/employees`
      );
      console.log(
        `   🏢 ${chalk.green(
          "Salons Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/salons`
      );
      console.log(
        `   💰 ${chalk.green(
          "Payments Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/payments`
      );
      console.log(
        `   🔄 ${chalk.green(
          "All Services Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/all`
      );

      // No console.log das rotas disponíveis, adicione:
      console.log(`\n${chalk.yellow("🧪 ROTAS DE TESTE")}`);
      console.log(
        `   🔧 ${chalk.green(
          "Test Connection:"
        )} http://localhost:${portaDisponivel}/api/test/connection`
      );
      console.log(
        `   🌐 ${chalk.green(
          "Test Microservices:"
        )} http://localhost:${portaDisponivel}/api/test/microservices-connection`
      );
      console.log(
        `   🔐 ${chalk.green(
          "Test Auth Service:"
        )} http://localhost:${portaDisponivel}/api/test/auth-service-connection`
      );
      console.log(
        `   ⚡ ${chalk.green(
          "Test Performance:"
        )} http://localhost:${portaDisponivel}/api/test/performance`
      );

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
