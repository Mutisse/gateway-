import axios, { AxiosError, AxiosResponse } from "axios";
import { SERVICE_CONFIG } from "../config/services.config";

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  statusCode: number;
  service: string;
  timestamp: string;
  details?: any;
}

export interface ServiceHealth {
  service: string;
  status: "healthy" | "unhealthy" | "unknown";
  responseTime: number;
  lastChecked: string;
  details?: any;
}

export class ServiceCommunicator {
  private readonly timeout = 10000;

  // 🎯 VERIFICAR SAÚDE DO SERVIÇO
  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    const serviceUrl =
      SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG];

    if (!serviceUrl) {
      return {
        service: serviceName,
        status: "unknown",
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        details: "Service URL not configured",
      };
    }

    try {
      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: this.timeout,
      });

      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: response.data,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorDetails = this.parseError(error, serviceName);

      return {
        service: serviceName,
        status: "unhealthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: errorDetails,
      };
    }
  }

  // 🎯 FAZER REQUISIÇÃO PARA SERVIÇO
  async request<T = any>(
    serviceName: string,
    options: {
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      endpoint: string;
      data?: any;
      headers?: Record<string, string>;
    }
  ): Promise<ServiceResponse<T>> {
    const serviceUrl =
      SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG];
    const startTime = Date.now();

    if (!serviceUrl) {
      return {
        success: false,
        error: "Serviço não configurado",
        code: "SERVICE_NOT_CONFIGURED",
        statusCode: 500,
        service: serviceName,
        timestamp: new Date().toISOString(),
        details: `URL para ${serviceName} não encontrada nas configurações`,
      };
    }

    try {
      const fullUrl = `${serviceUrl}${options.endpoint}`;

      console.log(`🔗 [${serviceName}] ${options.method} ${fullUrl}`);

      const response: AxiosResponse = await axios({
        method: options.method,
        url: fullUrl,
        data: options.data,
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Service": "beautytime-gateway",
          "X-Request-ID": `gateway-${Date.now()}`,
          ...options.headers,
        },
        timeout: this.timeout,
      });

      const responseTime = Date.now() - startTime;

      console.log(
        `✅ [${serviceName}] Resposta em ${responseTime}ms: ${response.status}`
      );

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        service: serviceName,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorInfo = this.parseError(error, serviceName);

      console.error(
        `❌ [${serviceName}] Erro em ${responseTime}ms:`,
        errorInfo
      );

      return {
        success: false,
        error: errorInfo.message,
        code: errorInfo.code,
        statusCode: errorInfo.statusCode,
        service: serviceName,
        timestamp: new Date().toISOString(),
        details: errorInfo.details,
      };
    }
  }

  // 🎯 ANALISAR ERROS E RETORNAR INFORMAÇÕES CLARAS
  private parseError(error: AxiosError, serviceName: string) {
    const serviceUrl =
      SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG];

    // Erro de timeout
    if (error.code === "ECONNABORTED") {
      return {
        message: `Serviço ${serviceName} não respondeu a tempo`,
        code: "SERVICE_TIMEOUT",
        statusCode: 504,
        details: {
          service: serviceName,
          url: serviceUrl,
          timeout: this.timeout,
          suggestion: "Verifique se o serviço está rodando e acessível",
        },
      };
    }

    // Erro de conexão recusada
    if (error.code === "ECONNREFUSED") {
      return {
        message: `Não foi possível conectar com o serviço ${serviceName}`,
        code: "SERVICE_UNREACHABLE",
        statusCode: 503,
        details: {
          service: serviceName,
          url: serviceUrl,
          suggestion:
            "O serviço pode não estar rodando ou a porta está incorreta",
        },
      };
    }

    // Erro de DNS/Não encontrado
    if (error.code === "ENOTFOUND") {
      return {
        message: `Serviço ${serviceName} não encontrado`,
        code: "SERVICE_NOT_FOUND",
        statusCode: 502,
        details: {
          service: serviceName,
          url: serviceUrl,
          suggestion: "Verifique a URL do serviço nas configurações",
        },
      };
    }

    // Erro com resposta do serviço (4xx, 5xx)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let message = `Erro no serviço ${serviceName}`;
      let code = "SERVICE_ERROR";

      if (status >= 400 && status < 500) {
        message = `Requisição rejeitada pelo serviço ${serviceName}`;
        code = "CLIENT_ERROR";
      } else if (status >= 500) {
        message = `Erro interno no serviço ${serviceName}`;
        code = "SERVER_ERROR";
      }

      return {
        message,
        code,
        statusCode: status,
        details: {
          service: serviceName,
          url: serviceUrl,
          responseStatus: status,
          responseData: data,
          suggestion: this.getSuggestionByStatus(status),
        },
      };
    }

    // Erro genérico
    return {
      message: `Erro de comunicação com o serviço ${serviceName}`,
      code: "COMMUNICATION_ERROR",
      statusCode: 500,
      details: {
        service: serviceName,
        url: serviceUrl,
        errorMessage: error.message,
        errorCode: error.code,
      },
    };
  }

  // 🎯 SUGESTÕES ESPECÍFICAS POR STATUS CODE
  private getSuggestionByStatus(statusCode: number): string {
    const suggestions: { [key: number]: string } = {
      400: "Verifique os dados enviados na requisição",
      401: "Token de autenticação inválido ou expirado",
      403: "Você não tem permissão para acessar este recurso",
      404: "O recurso solicitado não foi encontrado",
      409: "Conflito de dados, verifique informações duplicadas",
      422: "Dados de entrada inválidos ou incompletos",
      429: "Muitas requisições, tente novamente mais tarde",
      500: "Erro interno do servidor, tente novamente",
      502: "Serviço indisponível, tente novamente em alguns instantes",
      503: "Serviço em manutenção ou sobrecarregado",
      504: "Tempo limite excedido, serviço pode estar lento",
    };

    return suggestions[statusCode] || "Tente novamente ou contate o suporte";
  }

  // 🎯 VERIFICAR SAÚDE DE TODOS OS SERVIÇOS
  async checkAllServicesHealth(): Promise<ServiceHealth[]> {
    const services = Object.keys(SERVICE_CONFIG) as Array<
      keyof typeof SERVICE_CONFIG
    >;
    const healthChecks = await Promise.all(
      services.map((service) => this.checkServiceHealth(service))
    );

    return healthChecks;
  }

  // 🎯 MÉTODOS CONVENCIONAIS
  async get<T = any>(
    serviceName: string,
    endpoint: string,
    headers?: Record<string, string>
  ) {
    return this.request<T>(serviceName, { method: "GET", endpoint, headers });
  }

  async post<T = any>(
    serviceName: string,
    endpoint: string,
    data: any,
    headers?: Record<string, string>
  ) {
    return this.request<T>(serviceName, {
      method: "POST",
      endpoint,
      data,
      headers,
    });
  }

  async put<T = any>(
    serviceName: string,
    endpoint: string,
    data: any,
    headers?: Record<string, string>
  ) {
    return this.request<T>(serviceName, {
      method: "PUT",
      endpoint,
      data,
      headers,
    });
  }

  async delete<T = any>(
    serviceName: string,
    endpoint: string,
    headers?: Record<string, string>
  ) {
    return this.request<T>(serviceName, {
      method: "DELETE",
      endpoint,
      headers,
    });
  }
}

export const serviceCommunicator = new ServiceCommunicator();
