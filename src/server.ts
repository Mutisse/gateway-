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
      chalk.gray(`[new Date().toISOString()}]`),
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

// 🎯 FUNÇÃO PARA MATAR PROCESSO NA PORTA (OPCIONAL)
const matarProcessoNaPorta = async (porta: number): Promise<boolean> => {
  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    if (process.platform === "win32") {
      // Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${porta}`);
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.match(/:${porta}.*LISTENING\\s+(\\d+)/);
        if (match) {
          const pid = match[1];
          await execAsync(`taskkill /PID ${pid} /F`);
          log.success(`Processo ${pid} na porta ${porta} finalizado`);
          return true;
        }
      }
    } else {
      // Linux/Mac
      const { stdout } = await execAsync(`lsof -i :${porta} -t`);
      const pids = stdout.trim().split("\n");

      for (const pid of pids) {
        if (pid) {
          await execAsync(`kill -9 ${pid}`);
          log.success(`Processo ${pid} na porta ${porta} finalizado`);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    log.info(`Nenhum processo encontrado na porta ${porta}`);
    return false;
  }
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

      console.log(`\n📊 ${chalk.cyan("Endpoints disponíveis:")}`);
      console.log(
        `   ❤️  ${chalk.green(
          "Health:"
        )} http://localhost:${portaDisponivel}/health`
      );
      console.log(
        `   🔍 ${chalk.green(
          "Services Health:"
        )} http://localhost:${portaDisponivel}/api/services/health`
      );
      console.log(
        `   👥 ${chalk.green(
          "Users Ping:"
        )} http://localhost:${portaDisponivel}/api/ping/users`
      );
      console.log(
        `   🎯 ${chalk.green(
          "Test Register:"
        )} http://localhost:${portaDisponivel}/api/test/register`
      );
      console.log(
        `   🩺 ${chalk.green(
          "Diagnostic:"
        )} http://localhost:${portaDisponivel}/api/diagnostic/full`
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
