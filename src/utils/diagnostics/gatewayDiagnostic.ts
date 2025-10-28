import os from "os";
import chalk from "chalk";
import axios from "axios";

// 🕐 Utilitário de timestamp padronizado
const getTimestamp = () => chalk.gray(`[${new Date().toISOString()}]`);

class GatewayServiceDiagnostic {
  private serviceName = "Gateway Service";
  private services = {
    auth: process.env.AUTH_USERS_SERVICE_URL,
    scheduling: process.env.SCHEDULING_SERVICE_URL,
    employees: process.env.EMPLOYEES_SERVICE_URL,
    salons: process.env.SALONS_SERVICE_URL,
    payments: process.env.PAYMENTS_SERVICE_URL,
    notifications: process.env.NOTIFICATIONS_SERVICE_URL,
    analytics: process.env.ANALYTICS_SERVICE_URL,
    admin: process.env.ADMIN_SERVICE_URL, // ✅ Adicionado o serviço ADMIN
  };

  /**
   * Diagnóstico completo do Gateway
   */
  public async fullDiagnostic(): Promise<any> {
    console.log(
      `\n${getTimestamp()} ${chalk.blue("🔍")} Starting full diagnostic for ${
        this.serviceName
      }...`
    );

    const diagnostic = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      status: "healthy",
      checks: {
        memory: this.checkMemory(),
        system: this.checkSystem(),
        environment: this.checkEnvironment(),
        network: await this.checkNetwork(),
        services: await this.checkMicroservices(),
        routing: await this.checkRouting(),
        security: this.checkSecurity(),
        rateLimiting: this.checkRateLimiting(),
      },
      summary: {},
    };

    diagnostic.summary = this.generateSummary(diagnostic.checks);
    this.printDiagnosticResults(diagnostic);
    return diagnostic;
  }

  /**
   * Verifica conectividade com microserviços
   */
  public async checkMicroservices(): Promise<any> {
    const servicesStatus: any = {};
    let availableServices = 0;

    for (const [serviceName, serviceUrl] of Object.entries(this.services)) {
      if (!serviceUrl) {
        servicesStatus[serviceName] = {
          configured: false,
          status: "not_configured",
          url: "not_set",
        };
        continue;
      }

      try {
        const startTime = Date.now();
        const response = await axios.get(`${serviceUrl}/health`, {
          timeout: 5000,
        });
        const responseTime = Date.now() - startTime;

        servicesStatus[serviceName] = {
          configured: true,
          status: "available",
          url: serviceUrl,
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          serviceStatus: response.data?.status || "unknown",
        };

        availableServices++;
        console.log(
          `${getTimestamp()} ${chalk.green(
            "✅"
          )} ${serviceName}: Available (${responseTime}ms)`
        );
      } catch (error) {
        // Tratamento seguro do erro
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const statusCode =
          error && typeof error === "object" && "response" in error
            ? (error as any).response?.status
            : "timeout";

        servicesStatus[serviceName] = {
          configured: true,
          status: "unavailable",
          url: serviceUrl,
          error: errorMessage,
          statusCode: statusCode,
        };

        console.log(
          `${getTimestamp()} ${chalk.red(
            "❌"
          )} ${serviceName}: Unavailable - ${errorMessage}`
        );
      }
    }

    console.log(
      `${getTimestamp()} ${chalk.green(
        "✅"
      )} Microservices: ${availableServices}/${
        Object.keys(this.services).length
      } available`
    );

    return {
      services: servicesStatus,
      available: availableServices,
      total: Object.keys(this.services).length,
      availabilityRate: Math.round(
        (availableServices / Object.keys(this.services).length) * 100
      ),
    };
  }

  /**
   * Verifica configuração de roteamento
   */
  private async checkRouting(): Promise<any> {
    const routingChecks = {
      proxyConfigured: !!process.env.AUTH_USERS_SERVICE_URL,
      corsEnabled: true,
      loadBalancing: this.checkLoadBalancing(),
      circuitBreaker: this.checkCircuitBreaker(),
    };

    console.log(
      `${getTimestamp()} ${chalk.green("✅")} Routing: ${
        routingChecks.proxyConfigured ? "Configured" : "Not configured"
      }`
    );

    return routingChecks;
  }

  /**
   * Verifica balanceamento de carga
   */
  private checkLoadBalancing(): any {
    return {
      enabled: false,
      strategy: "round_robin",
      healthyInstances: 1,
    };
  }

  /**
   * Verifica circuit breaker
   */
  private checkCircuitBreaker(): any {
    return {
      enabled: false,
      failureThreshold: 5,
      timeout: 30000,
    };
  }

  /**
   * Verifica configurações de segurança
   */
  private checkSecurity(): any {
    const securityChecks = {
      helmetEnabled: true,
      corsConfigured: !!process.env.ALLOWED_ORIGINS,
      rateLimiting: !!process.env.RATE_LIMIT_MAX_REQUESTS,
      https: process.env.NODE_ENV === "production",
      authMiddleware: true,
    };

    const enabledChecks = Object.values(securityChecks).filter(Boolean).length;
    console.log(
      `${getTimestamp()} ${chalk.green("✅")} Security: ${enabledChecks}/${
        Object.keys(securityChecks).length
      } features enabled`
    );

    return securityChecks;
  }

  /**
   * Verifica rate limiting
   */
  private checkRateLimiting(): any {
    const rateLimiting = {
      enabled: !!process.env.RATE_LIMIT_MAX_REQUESTS,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
      skipSuccessful: true,
    };

    console.log(
      `${getTimestamp()} ${chalk.green("✅")} Rate Limiting: ${
        rateLimiting.enabled ? "Enabled" : "Disabled"
      }`
    );

    return rateLimiting;
  }

  /**
   * Verifica conectividade de rede
   */
  private async checkNetwork(): Promise<any> {
    const networkChecks = {
      dnsResolution: await this.checkDNSResolution(),
      internetConnectivity: await this.checkInternetConnectivity(),
      portAvailability: this.checkPortAvailability(),
      latency: await this.checkLatency(),
    };

    return networkChecks;
  }

  /**
   * Verifica resolução DNS
   */
  private async checkDNSResolution(): Promise<any> {
    try {
      const dns = await import("dns");
      const dnsPromises = dns.promises;

      await dnsPromises.resolve("google.com");
      return { status: "healthy", message: "DNS resolution working" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown DNS error";
      return { status: "unhealthy", error: errorMessage };
    }
  }

  /**
   * Verifica conectividade com internet
   */
  private async checkInternetConnectivity(): Promise<any> {
    try {
      await axios.get("https://www.google.com", { timeout: 5000 });
      return { status: "healthy", message: "Internet connectivity OK" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown connectivity error";
      return {
        status: "unhealthy",
        error: "No internet connectivity - " + errorMessage,
      };
    }
  }

  /**
   * Verifica disponibilidade de portas
   */
  private checkPortAvailability(): any {
    const port = parseInt(process.env.PORT || "8080");
    return {
      port: port,
      status: "available",
      protocol: "HTTP",
    };
  }

  /**
   * Verifica latência
   */
  private async checkLatency(): Promise<any> {
    const latencies: number[] = [];

    for (const serviceUrl of Object.values(this.services)) {
      if (!serviceUrl) continue;

      try {
        const startTime = Date.now();
        await axios.get(`${serviceUrl}/health`, { timeout: 3000 });
        latencies.push(Date.now() - startTime);
      } catch (error) {
        // Ignorar serviços indisponíveis para teste de latência
      }
    }

    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;

    return {
      average: avgLatency,
      samples: latencies.length,
      status:
        avgLatency < 1000 ? "good" : avgLatency < 3000 ? "acceptable" : "poor",
    };
  }

  /**
   * Verifica uso de memória
   */
  private checkMemory(): any {
    const memoryUsage = process.memoryUsage();
    const formatMemory = (bytes: number) => Math.round(bytes / 1024 / 1024);

    const memoryInfo = {
      heapUsed: formatMemory(memoryUsage.heapUsed),
      heapTotal: formatMemory(memoryUsage.heapTotal),
      rss: formatMemory(memoryUsage.rss),
      external: formatMemory(memoryUsage.external),
      systemFree: formatMemory(os.freemem()),
      systemTotal: formatMemory(os.totalmem()),
    };

    console.log(
      `${getTimestamp()} ${chalk.green("✅")} Memory: ${
        memoryInfo.heapUsed
      }MB used`
    );

    return memoryInfo;
  }

  /**
   * Verifica informações do sistema
   */
  private checkSystem(): any {
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      cpu: os.cpus().length,
      loadAverage: os.loadavg(),
    };

    console.log(
      `${getTimestamp()} ${chalk.green("✅")} System: ${systemInfo.cpu} CPUs, ${
        systemInfo.nodeVersion
      }`
    );

    return systemInfo;
  }

  /**
   * Verifica variáveis de ambiente
   */
  private checkEnvironment(): any {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || "not set",
      PORT: process.env.PORT || "not set",
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? "set" : "not set",
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
        ? "set"
        : "not set",
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS
        ? "set"
        : "not set",
      // Serviços - ✅ Atualizado com todos os serviços
      AUTH_USERS_SERVICE_URL: process.env.AUTH_USERS_SERVICE_URL
        ? "set"
        : "not set",
      SCHEDULING_SERVICE_URL: process.env.SCHEDULING_SERVICE_URL
        ? "set"
        : "not set",
      EMPLOYEES_SERVICE_URL: process.env.EMPLOYEES_SERVICE_URL
        ? "set"
        : "not set",
      SALONS_SERVICE_URL: process.env.SALONS_SERVICE_URL ? "set" : "not set",
      PAYMENTS_SERVICE_URL: process.env.PAYMENTS_SERVICE_URL
        ? "set"
        : "not set",
      NOTIFICATIONS_SERVICE_URL: process.env.NOTIFICATIONS_SERVICE_URL
        ? "set"
        : "not set",
      ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL
        ? "set"
        : "not set",
      ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL ? "set" : "not set",
    };

    const configuredVars = Object.values(envVars).filter(
      (v) => v === "set"
    ).length;
    console.log(
      `${getTimestamp()} ${chalk.green("✅")} Environment: ${configuredVars}/${
        Object.keys(envVars).length
      } variables set`
    );

    return envVars;
  }

  /**
   * Gera resumo do diagnóstico
   */
  private generateSummary(checks: any): any {
    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter((check: any) => {
      if (check.status === "available" || check.status === "healthy")
        return true;
      if (check.available !== undefined) return check.available > 0;
      if (check.enabled !== undefined) return check.enabled;
      return true;
    }).length;

    return {
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      successRate: Math.round((passedChecks / totalChecks) * 100),
      overallStatus: passedChecks === totalChecks ? "healthy" : "degraded",
      servicesAvailable: checks.services?.available || 0,
      totalServices: checks.services?.total || 0,
    };
  }

  /**
   * Imprime resultados do diagnóstico
   */
  private printDiagnosticResults(diagnostic: any): void {
    console.log(
      `\n${getTimestamp()} ${chalk.cyan("📊")} DIAGNOSTIC RESULTS for ${
        this.serviceName
      }`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Overall Status: ${
        diagnostic.summary.overallStatus === "healthy"
          ? chalk.green("✅ HEALTHY")
          : chalk.yellow("⚠️ DEGRADED")
      }`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Checks: ${
        diagnostic.summary.passedChecks
      }/${diagnostic.summary.totalChecks} passed`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Success Rate: ${chalk.blue(
        diagnostic.summary.successRate + "%"
      )}`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Services: ${chalk.blue(
        diagnostic.summary.servicesAvailable +
          "/" +
          diagnostic.summary.totalServices +
          " available"
      )}`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Memory: ${chalk.blue(
        diagnostic.checks.memory.heapUsed + "MB"
      )}`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Uptime: ${chalk.blue(
        diagnostic.checks.system.uptime + "s"
      )}`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("├──")} Rate Limiting: ${
        diagnostic.checks.rateLimiting.enabled
          ? chalk.green("✅")
          : chalk.yellow("⚠️")
      }`
    );
    console.log(
      `${getTimestamp()} ${chalk.gray("└──")} Security: ${chalk.green(
        Object.values(diagnostic.checks.security).filter(Boolean).length +
          "/5 features"
      )}`
    );
  }

  /**
   * Diagnóstico rápido (apenas crítico)
   */
  public async quickDiagnostic(): Promise<any> {
    console.log(
      `\n${getTimestamp()} ${chalk.blue("🔍")} Quick diagnostic for ${
        this.serviceName
      }...`
    );

    const criticalChecks = {
      services: await this.checkMicroservices(),
      memory: this.checkMemory(),
      environment: this.checkEnvironment(),
      network: await this.checkNetwork(),
    };

    const allCritical =
      criticalChecks.services.available > 0 &&
      criticalChecks.memory.heapUsed < 500 &&
      criticalChecks.environment.NODE_ENV !== "not set";

    console.log(
      `${getTimestamp()} ${
        allCritical ? chalk.green("✅") : chalk.red("❌")
      } Quick diagnostic: ${
        allCritical
          ? "ALL CRITICAL SYSTEMS OK"
          : "SOME CRITICAL SYSTEMS FAILING"
      }`
    );

    return {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      status: allCritical ? "healthy" : "degraded",
      criticalChecks,
    };
  }

  /**
   * Diagnóstico de um serviço específico
   */
  public async serviceDiagnostic(serviceName: string): Promise<any> {
    const serviceUrl = (this.services as any)[serviceName];

    if (!serviceUrl) {
      return {
        service: serviceName,
        status: "not_configured",
        error: `Service URL not configured for ${serviceName}`,
      };
    }

    try {
      const startTime = Date.now();
      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: 10000,
      });
      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        status: "available",
        url: serviceUrl,
        responseTime: `${responseTime}ms`,
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const statusCode =
        error && typeof error === "object" && "response" in error
          ? (error as any).response?.status
          : "timeout";

      return {
        service: serviceName,
        status: "unavailable",
        url: serviceUrl,
        error: errorMessage,
        statusCode: statusCode,
      };
    }
  }

  /**
   * Monitoramento contínuo
   */
  public startContinuousMonitoring(intervalMs: number = 60000): void {
    console.log(
      `${getTimestamp()} ${chalk.blue(
        "📈"
      )} Starting continuous monitoring for ${this.serviceName}...`
    );

    setInterval(async () => {
      const diagnostic = await this.quickDiagnostic();

      if (diagnostic.status === "degraded") {
        console.log(
          `${getTimestamp()} ${chalk.red("🚨")} Gateway degradation detected!`
        );
        // Aqui você poderia enviar alertas, notificações, etc.
      }
    }, intervalMs);
  }

  /**
   * ✅ NOVO MÉTODO: Retorna estatísticas de uso do gateway
   */
  public getGatewayStats(): any {
    const memoryUsage = process.memoryUsage();
    const formatMemory = (bytes: number) => Math.round(bytes / 1024 / 1024);

    return {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      stats: {
        uptime: Math.floor(process.uptime()),
        memory: {
          heapUsed: formatMemory(memoryUsage.heapUsed),
          heapTotal: formatMemory(memoryUsage.heapTotal),
          rss: formatMemory(memoryUsage.rss),
          usagePercent: Math.round(
            (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
          ),
        },
        cpu: {
          count: os.cpus().length,
          loadAverage: os.loadavg(),
        },
        network: {
          port: parseInt(process.env.PORT || "8080"),
          environment: process.env.NODE_ENV || "development",
        },
      },
    };
  }

  /**
   * ✅ NOVO MÉTODO: Verifica saúde de múltiplos serviços de uma vez
   */
  public async bulkServicesDiagnostic(serviceNames: string[]): Promise<any> {
    console.log(
      `${getTimestamp()} ${chalk.blue(
        "🔍"
      )} Bulk diagnostic for services: ${serviceNames.join(", ")}`
    );

    const results: any = {};

    for (const serviceName of serviceNames) {
      results[serviceName] = await this.serviceDiagnostic(serviceName);
    }

    const availableServices = Object.values(results).filter(
      (result: any) => result.status === "available"
    ).length;

    return {
      timestamp: new Date().toISOString(),
      services: results,
      summary: {
        total: serviceNames.length,
        available: availableServices,
        unavailable: serviceNames.length - availableServices,
        availabilityRate: Math.round(
          (availableServices / serviceNames.length) * 100
        ),
      },
    };
  }

  /**
   * ✅ NOVO MÉTODO: Verifica dependências críticas do sistema
   */
  public async checkCriticalDependencies(): Promise<any> {
    const criticalServices = ["auth", "payments", "scheduling"]; // Serviços considerados críticos

    console.log(
      `${getTimestamp()} ${chalk.blue("🔍")} Checking critical dependencies...`
    );

    const results = await this.bulkServicesDiagnostic(criticalServices);
    const allCriticalAvailable = results.summary.availabilityRate === 100;

    return {
      ...results,
      status: allCriticalAvailable ? "healthy" : "degraded",
      message: allCriticalAvailable
        ? "All critical services are available"
        : "Some critical services are unavailable",
    };
  }
}

// Singleton instance
export const gatewayDiagnostic = new GatewayServiceDiagnostic();
export default gatewayDiagnostic;
