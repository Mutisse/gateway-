import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

export class ServiceRetry {
  private client: AxiosInstance;

  constructor(baseURL: string, private maxRetries: number = 2) {
    this.client = axios.create({
      baseURL,
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": "gateway",
      },
    });

    this.setupRetryInterceptor();
    this.setupRequestLogger();
  }

  private setupRetryInterceptor() {
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ ${response.config.method?.toUpperCase()} ${
            response.config.url
          } - Status: ${response.status}`
        );
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & {
          retryCount?: number;
        };

        if (!config || !this.shouldRetry(error)) {
          console.log(`❌ Falha final: ${config?.url} - ${error.message}`);
          throw error;
        }

        config.retryCount = (config.retryCount || 0) + 1;

        if (config.retryCount >= this.maxRetries) {
          console.log(
            `❌ Máximo de retentativas (${this.maxRetries}) atingido para: ${config.url}`
          );
          throw error;
        }

        const delay = this.calculateDelay(config.retryCount);
        console.log(
          `🔄 Retentativa ${config.retryCount}/${this.maxRetries} para ${config.url} em ${delay}ms`
        );

        await this.sleep(delay);

        return this.client(config);
      }
    );
  }

  private setupRequestLogger() {
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
        );
        return config;
      },
      (error) => {
        console.log(`❌ Erro na requisição: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    const retryableStatus = [429, 503, 504]; // Too Many Requests, Service Unavailable, Gateway Timeout
    const retryableCodes = ["ECONNABORTED", "ECONNRESET", "ETIMEDOUT"];

    return (
      retryableStatus.includes(error.response?.status || 0) ||
      retryableCodes.includes(error.code || "")
    );
  }

  private calculateDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, max 10s
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

// ✅ CLIENTS PARA TODOS OS MICROSERVIÇOS
export const authServiceClient = new ServiceRetry(
  process.env.AUTH_USERS_SERVICE_URL ||
    "https://auth-users-service.onrender.com",
  2
);

export const schedulingServiceClient = new ServiceRetry(
  process.env.SCHEDULING_SERVICE_URL || "http://localhost:3002",
  2
);

export const employeesServiceClient = new ServiceRetry(
  process.env.EMPLOYEES_SERVICE_URL || "http://localhost:3003",
  2
);

export const analyticsServiceClient = new ServiceRetry(
  process.env.ANALYTICS_SERVICE_URL || "http://localhost:3004",
  2
);

// ✅ CLIENT PARA O PRÓPRIO GATEWAY (health checks internos)
export const gatewayClient = new ServiceRetry(
  process.env.GATEWAY_URL || "http://localhost:3001",
  1
);

// ✅ CLIENT UNIFICADO PARA FACILITAR O USO
export const serviceClients = {
  auth: authServiceClient,
  scheduling: schedulingServiceClient,
  employees: employeesServiceClient,
  analytics: analyticsServiceClient,
  gateway: gatewayClient,
};

// ✅ TIPOS PARA OS SERVIÇOS
export type ServiceName =
  | "auth"
  | "scheduling"
  | "employees"
  | "analytics"
  | "gateway";

// ✅ UTILITÁRIO PARA OBTER CLIENT POR NOME
export function getServiceClient(serviceName: ServiceName): ServiceRetry {
  return serviceClients[serviceName];
}

// ✅ VERIFICAÇÃO DE SAÚDE DE TODOS OS SERVIÇOS
export async function checkAllServicesHealth() {
  const services = [
    {
      name: "Auth Service",
      client: authServiceClient,
      url: process.env.AUTH_USERS_SERVICE_URL,
    },
    {
      name: "Scheduling Service",
      client: schedulingServiceClient,
      url: process.env.SCHEDULING_SERVICE_URL,
    },
    {
      name: "Employees Service",
      client: employeesServiceClient,
      url: process.env.EMPLOYEES_SERVICE_URL,
    },
    {
      name: "Analytics Service",
      client: analyticsServiceClient,
      url: process.env.ANALYTICS_SERVICE_URL,
    },
  ];

  const healthResults = [];

  for (const service of services) {
    try {
      console.log(`🔍 Verificando saúde do ${service.name}...`);
      const response = await service.client.getClient().get("/health");

      healthResults.push({
        service: service.name,
        status: "healthy",
        url: service.url,
        responseTime: response.headers["x-response-time"],
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ ${service.name} está saudável`);
    } catch (error: any) {
      console.log(`❌ ${service.name} está com problemas:`, error.message);

      healthResults.push({
        service: service.name,
        status: "unhealthy",
        url: service.url,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return healthResults;
}

// ✅ TESTE DE CONEXÃO PARA UM SERVIÇO ESPECÍFICO
export async function testServiceConnection(
  serviceName: ServiceName,
  endpoint: string = "/health"
) {
  try {
    const client = getServiceClient(serviceName);
    const response = await client.getClient().get(endpoint);

    return {
      success: true,
      service: serviceName,
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      service: serviceName,
      error: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    };
  }
}

export default {
  authServiceClient,
  schedulingServiceClient,
  employeesServiceClient,
  analyticsServiceClient,
  gatewayClient,
  serviceClients,
  getServiceClient,
  checkAllServicesHealth,
  testServiceConnection,
};
