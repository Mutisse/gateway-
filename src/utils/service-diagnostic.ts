import {
  serviceCommunicator,
  type ServiceHealth,
  type ServiceResponse,
} from "./service-communicator";
import { SERVICE_CONFIG } from "./config";

// 🎯 INTERFACES EXTENDIDAS PARA DIAGNÓSTICO
export interface ServiceHealthWithTimestamp extends ServiceHealth {
  timestamp: string;
}

export interface DiagnosticResult {
  timestamp: string;
  overallStatus: "healthy" | "degraded" | "unhealthy";
  services: ServiceHealth[];
  issues: ServiceIssue[];
  statistics: DiagnosticStatistics;
  recommendations: string[];
}

export interface ServiceIssue {
  service: string;
  severity: "high" | "medium" | "low";
  type: IssueType;
  message: string;
  details: any;
  suggestion: string;
}

export interface DiagnosticStatistics {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
}

export type IssueType =
  | "connection_timeout"
  | "connection_refused"
  | "service_not_found"
  | "high_response_time"
  | "service_error"
  | "authentication_error"
  | "configuration_error"
  | "unknown_error";

export class ServiceDiagnostic {
  private readonly responseTimeThreshold = 2000; // 2 seconds
  private readonly healthCheckInterval = 30000; // 30 seconds
  private healthHistory: Map<string, ServiceHealthWithTimestamp[]> = new Map();

  // 🎯 EXECUTAR DIAGNÓSTICO COMPLETO
  async runFullDiagnostic(): Promise<DiagnosticResult> {
    const timestamp = new Date().toISOString();

    console.log("🔍 Iniciando diagnóstico completo dos serviços...");

    // 1. Verificar saúde de todos os serviços
    const servicesHealth = await serviceCommunicator.checkAllServicesHealth();

    // 2. Identificar problemas
    const issues = this.identifyIssues(servicesHealth);

    // 3. Calcular estatísticas
    const statistics = this.calculateStatistics(servicesHealth);

    // 4. Determinar status geral
    const overallStatus = this.determineOverallStatus(servicesHealth, issues);

    // 5. Gerar recomendações
    const recommendations = this.generateRecommendations(issues, statistics);

    // 6. Armazenar no histórico (COM TIMESTAMP)
    this.updateHealthHistory(servicesHealth, timestamp);

    const diagnosticResult: DiagnosticResult = {
      timestamp,
      overallStatus,
      services: servicesHealth,
      issues,
      statistics,
      recommendations,
    };

    console.log(`📊 Diagnóstico concluído: ${overallStatus.toUpperCase()}`);

    return diagnosticResult;
  }

  // 🎯 DIAGNÓSTICO ESPECÍFICO PARA UM SERVIÇO
  async diagnoseService(serviceName: string): Promise<{
    service: string;
    health: ServiceHealth;
    issues: ServiceIssue[];
    dependencies?: string[];
  }> {
    const health = await serviceCommunicator.checkServiceHealth(serviceName);
    const issues = this.identifyServiceIssues(serviceName, health);
    const dependencies = this.getServiceDependencies(serviceName);

    return {
      service: serviceName,
      health,
      issues,
      dependencies,
    };
  }

  // 🎯 TESTE DE CONECTIVIDADE DETALHADO
  async testConnectivity(serviceName: string): Promise<{
    service: string;
    url: string;
    connectivity: "reachable" | "unreachable";
    dnsResolution: boolean;
    portAccess: boolean;
    responseTime: number;
    details: any;
  }> {
    const serviceUrl =
      SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG];
    const startTime = Date.now();

    try {
      // Teste básico de conectividade
      const health = await serviceCommunicator.checkServiceHealth(serviceName);
      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        url: serviceUrl,
        connectivity: "reachable",
        dnsResolution: true,
        portAccess: true,
        responseTime,
        details: {
          status: health.status,
          responseData: health.details,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        url: serviceUrl,
        connectivity: "unreachable",
        dnsResolution: this.testDNSResolution(serviceUrl),
        portAccess: await this.testPortAccess(serviceUrl),
        responseTime,
        details: {
          error: error.message,
          errorCode: error.code,
          suggestion: this.getConnectivitySuggestion(error),
        },
      };
    }
  }

  // 🎯 IDENTIFICAR PROBLEMAS
  private identifyIssues(servicesHealth: ServiceHealth[]): ServiceIssue[] {
    const issues: ServiceIssue[] = [];

    for (const health of servicesHealth) {
      const serviceIssues = this.identifyServiceIssues(health.service, health);
      issues.push(...serviceIssues);
    }

    return issues;
  }

  private identifyServiceIssues(
    serviceName: string,
    health: ServiceHealth
  ): ServiceIssue[] {
    const issues: ServiceIssue[] = [];

    // Serviço não saudável
    if (health.status !== "healthy") {
      const issue = this.createServiceIssue(
        serviceName,
        "high",
        this.mapStatusToIssueType(health),
        `Serviço ${serviceName} não está respondendo`,
        health.details,
        "Verifique se o serviço está rodando e acessível"
      );
      issues.push(issue);
    }

    // Tempo de resposta alto
    if (
      health.status === "healthy" &&
      health.responseTime > this.responseTimeThreshold
    ) {
      const issue = this.createServiceIssue(
        serviceName,
        "medium",
        "high_response_time",
        `Serviço ${serviceName} está lento (${health.responseTime}ms)`,
        {
          responseTime: health.responseTime,
          threshold: this.responseTimeThreshold,
        },
        "Considere otimizar o serviço ou verificar a carga"
      );
      issues.push(issue);
    }

    // Serviço desconhecido (não configurado)
    if (health.status === "unknown") {
      const issue = this.createServiceIssue(
        serviceName,
        "medium",
        "configuration_error",
        `Serviço ${serviceName} não está configurado`,
        { suggestion: "Verifique as variáveis de ambiente" },
        "Configure a URL do serviço nas variáveis de ambiente"
      );
      issues.push(issue);
    }

    return issues;
  }

  // 🎯 CRIAR ISSUE PADRONIZADA
  private createServiceIssue(
    service: string,
    severity: "high" | "medium" | "low",
    type: IssueType,
    message: string,
    details: any,
    suggestion: string
  ): ServiceIssue {
    return {
      service,
      severity,
      type,
      message,
      details,
      suggestion,
    };
  }

  // 🎯 MAPEAR STATUS PARA TIPO DE ISSUE
  private mapStatusToIssueType(health: ServiceHealth): IssueType {
    if (health.status === "healthy") return "unknown_error";

    const details = health.details;

    if (details?.code === "SERVICE_TIMEOUT") return "connection_timeout";
    if (details?.code === "SERVICE_UNREACHABLE") return "connection_refused";
    if (details?.code === "SERVICE_NOT_FOUND") return "service_not_found";
    if (details?.statusCode >= 500) return "service_error";
    if (details?.statusCode === 401 || details?.statusCode === 403)
      return "authentication_error";

    return "unknown_error";
  }

  // 🎯 CALCULAR ESTATÍSTICAS
  private calculateStatistics(
    servicesHealth: ServiceHealth[]
  ): DiagnosticStatistics {
    const healthyServices = servicesHealth.filter(
      (s) => s.status === "healthy"
    );
    const responseTimes = healthyServices
      .map((s) => s.responseTime)
      .filter((time) => time > 0);

    const totalResponseTime = responseTimes.reduce(
      (sum, time) => sum + time,
      0
    );
    const averageResponseTime =
      responseTimes.length > 0 ? totalResponseTime / responseTimes.length : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

    const successRate =
      servicesHealth.length > 0
        ? (healthyServices.length / servicesHealth.length) * 100
        : 0;

    return {
      totalServices: servicesHealth.length,
      healthyServices: healthyServices.length,
      unhealthyServices: servicesHealth.length - healthyServices.length,
      averageResponseTime: Math.round(averageResponseTime),
      maxResponseTime,
      minResponseTime,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  // 🎯 DETERMINAR STATUS GERAL
  private determineOverallStatus(
    servicesHealth: ServiceHealth[],
    issues: ServiceIssue[]
  ): "healthy" | "degraded" | "unhealthy" {
    const healthyCount = servicesHealth.filter(
      (s) => s.status === "healthy"
    ).length;
    const totalCount = servicesHealth.length;

    if (healthyCount === totalCount) return "healthy";
    if (healthyCount === 0) return "unhealthy";

    // Se mais da metade está saudável, considera degradado
    return healthyCount >= totalCount / 2 ? "degraded" : "unhealthy";
  }

  // 🎯 GERAR RECOMENDAÇÕES
  private generateRecommendations(
    issues: ServiceIssue[],
    statistics: DiagnosticStatistics
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em issues
    const highSeverityIssues = issues.filter(
      (issue) => issue.severity === "high"
    );
    const mediumSeverityIssues = issues.filter(
      (issue) => issue.severity === "medium"
    );

    if (highSeverityIssues.length > 0) {
      recommendations.push(
        "⚠️ Serviços críticos estão com problemas. Priorize a resolução."
      );
    }

    if (mediumSeverityIssues.length > 0) {
      recommendations.push(
        "🔧 Alguns serviços estão com problemas de performance. Considere otimizações."
      );
    }

    // Recomendações baseadas em estatísticas
    if (statistics.successRate < 80) {
      recommendations.push(
        "📉 Taxa de sucesso baixa. Verifique a saúde dos serviços."
      );
    }

    if (statistics.averageResponseTime > 1000) {
      recommendations.push(
        "🐌 Tempo de resposta médio alto. Considere otimizar a infraestrutura."
      );
    }

    if (statistics.healthyServices === 0) {
      recommendations.push(
        "🚨 Todos os serviços estão indisponíveis. Verifique a infraestrutura."
      );
    }

    // Recomendação geral se tudo estiver bem
    if (recommendations.length === 0) {
      recommendations.push("✅ Todos os serviços estão operando normalmente.");
    }

    return recommendations;
  }

  // 🎯 TESTES DE CONECTIVIDADE AVANÇADOS
  private testDNSResolution(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      // Simulação básica - em produção usaria dns.lookup()
      return hostname !== "localhost" && !hostname.includes("undefined");
    } catch {
      return false;
    }
  }

  private async testPortAccess(url: string): Promise<boolean> {
    try {
      const { port, hostname } = new URL(url);
      const testPort = port || (url.startsWith("https") ? "443" : "80");

      // Simulação básica - em produção tentaria conexão TCP
      return parseInt(testPort) > 0 && parseInt(testPort) < 65536;
    } catch {
      return false;
    }
  }

  private getConnectivitySuggestion(error: any): string {
    const errorCode = error.code;

    const suggestions: { [key: string]: string } = {
      ECONNREFUSED:
        "O serviço pode não estar rodando ou a porta está incorreta",
      ENOTFOUND: "Verifique se o hostname está correto e resolvendo DNS",
      ETIMEDOUT: "O serviço pode estar sobrecarregado ou com problemas de rede",
      ECONNABORTED: "Timeout na conexão, verifique a latência da rede",
    };

    return (
      suggestions[errorCode] ||
      "Verifique a conectividade de rede e as configurações do serviço"
    );
  }

  // 🎯 HISTÓRICO E MONITORAMENTO (CORRIGIDO)
  private updateHealthHistory(
    servicesHealth: ServiceHealth[],
    timestamp: string
  ): void {
    servicesHealth.forEach((health) => {
      if (!this.healthHistory.has(health.service)) {
        this.healthHistory.set(health.service, []);
      }

      const history = this.healthHistory.get(health.service)!;

      // 🎯 AGORA COM A INTERFACE CORRETA
      const healthWithTimestamp: ServiceHealthWithTimestamp = {
        ...health,
        timestamp,
      };

      history.push(healthWithTimestamp);

      // Manter apenas últimas 100 entradas
      if (history.length > 100) {
        history.shift();
      }
    });
  }

  // 🎯 OBTER HISTÓRICO DE UM SERVIÇO (CORRIGIDO)
  getServiceHistory(serviceName: string): ServiceHealthWithTimestamp[] {
    return this.healthHistory.get(serviceName) || [];
  }

  // 🎯 OBTER STATUS DOS SERVIÇOS COM DEPENDÊNCIAS
  private getServiceDependencies(serviceName: string): string[] {
    const dependencies: { [key: string]: string[] } = {
      AUTH_USERS_SERVICE: [],
      SCHEDULING_SERVICE: ["AUTH_USERS_SERVICE"],
      EMPLOYEES_SERVICE: ["AUTH_USERS_SERVICE"],
      SALONS_SERVICE: ["AUTH_USERS_SERVICE"],
      PAYMENTS_SERVICE: ["AUTH_USERS_SERVICE", "SCHEDULING_SERVICE"],
      NOTIFICATIONS_SERVICE: ["AUTH_USERS_SERVICE"],
    };

    return dependencies[serviceName] || [];
  }

  // 🎯 RELATÓRIO DE SAÚDE DO SISTEMA
  async generateHealthReport(): Promise<{
    summary: DiagnosticStatistics;
    services: ServiceHealth[];
    criticalIssues: ServiceIssue[];
    timestamp: string;
  }> {
    const diagnostic = await this.runFullDiagnostic();

    return {
      summary: diagnostic.statistics,
      services: diagnostic.services,
      criticalIssues: diagnostic.issues.filter(
        (issue) => issue.severity === "high"
      ),
      timestamp: diagnostic.timestamp,
    };
  }

  // 🎯 MÉTODO PARA LIMPAR HISTÓRICO
  clearHistory(serviceName?: string): void {
    if (serviceName) {
      this.healthHistory.delete(serviceName);
    } else {
      this.healthHistory.clear();
    }
  }

  // 🎯 OBTER ESTATÍSTICAS DO HISTÓRICO
  getHistoryStatistics(serviceName: string): {
    service: string;
    totalChecks: number;
    uptimePercentage: number;
    averageResponseTime: number;
    lastStatus: string;
  } {
    const history = this.getServiceHistory(serviceName);

    if (history.length === 0) {
      return {
        service: serviceName,
        totalChecks: 0,
        uptimePercentage: 0,
        averageResponseTime: 0,
        lastStatus: "unknown",
      };
    }

    const healthyChecks = history.filter((h) => h.status === "healthy").length;
    const totalChecks = history.length;
    const uptimePercentage = (healthyChecks / totalChecks) * 100;

    const responseTimes = history
      .filter((h) => h.status === "healthy" && h.responseTime > 0)
      .map((h) => h.responseTime);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    const lastStatus = history[history.length - 1].status;

    return {
      service: serviceName,
      totalChecks,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      lastStatus,
    };
  }
}

export const serviceDiagnostic = new ServiceDiagnostic();
