import dotenv from "dotenv";
import path from "path";

// Carregar .env
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

import app from "../app";
import chalk from "chalk";

// Utilitário de timestamp
const getTimestamp = () => chalk.gray(`[${new Date().toISOString()}]`);

// Configurações
const PORT = parseInt(process.env.PORT || "8080");
const NODE_ENV = process.env.NODE_ENV || "development";

let server: ReturnType<typeof app.listen> | null = null;

const startServer = async () => {
  try {
    console.log(
      `${getTimestamp()} ${chalk.blue("🚀")} Starting Gateway Service...`
    );

    server = app.listen(PORT, () => {
      console.log(
        `${getTimestamp()} ${chalk.green("✅")} Gateway Service running on port ${PORT}`
      );
      console.log(
        `${getTimestamp()} ${chalk.blue("🌐")} Environment: ${NODE_ENV}`
      );
      console.log(
        `${getTimestamp()} ${chalk.blue("📊")} Status Check: http://localhost:${PORT}/status`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(
        `${getTimestamp()} ${chalk.yellow("🛑")} Received ${signal}, shutting down...`
      );

      if (server) {
        server.close(() => {
          process.exit(0);
        });

        setTimeout(() => {
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error(
      `${getTimestamp()} ${chalk.red("❌")} Error starting Gateway:`,
      error
    );
    process.exit(1);
  }
};

// Iniciar servidor apenas se executado diretamente
if (require.main === module) {
  startServer();
}

export { startServer };