import { exec } from "child_process";
import { promisify } from "util";
import * as net from 'net'; // ADICIONE ESTA LINHA NO TOPO

// O código que usa 'net' deve funcionar agora

const execAsync = promisify(exec);

export class PortManager {
  static async findAvailablePort(
    startPort: number,
    maxAttempts: number = 10
  ): Promise<number> {
    const net = require("net");

    for (let port = startPort; port <= startPort + maxAttempts; port++) {
      const isAvailable = await this.checkPortAvailability(port);
      if (isAvailable) {
        return port;
      }
      console.log(`⚠️ Porta ${port} ocupada, tentando ${port + 1}...`);
    }

    throw new Error(
      `Não encontrou porta disponível entre ${startPort} e ${
        startPort + maxAttempts
      }`
    );
  }

  private static checkPortAvailability(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  static async killProcessOnPort(port: number): Promise<boolean> {
    try {
      if (process.platform === "win32") {
        // Windows
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.split("\n");

        for (const line of lines) {
          const match = line.match(/:${port}.*LISTENING\s+(\d+)/);
          if (match) {
            const pid = match[1];
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Processo ${pid} na porta ${port} finalizado`);
            return true;
          }
        }
      } else {
        // Linux/Mac
        const { stdout } = await execAsync(`lsof -i :${port} -t`);
        const pids = stdout.trim().split("\n");

        for (const pid of pids) {
          if (pid) {
            await execAsync(`kill -9 ${pid}`);
            console.log(`✅ Processo ${pid} na porta ${port} finalizado`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.log(`ℹ️ Nenhum processo encontrado na porta ${port}`);
      return false;
    }
  }
}
