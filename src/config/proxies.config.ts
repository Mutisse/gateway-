import axios from "axios";
import http from "http";
import https from "https";
import chalk from "chalk";

// Configurações de timeout ajustáveis
const defaultTimeout = Number(process.env.PROXY_TIMEOUT) || 120000; // 2 minutos

// Tipos de erro
type ServiceError = {
  code?: string;
  message: string;
  config?: {
    url?: string;
    method?: string;
    timeout?: number;
  };
  response?: {
    status?: number;
    data?: any;
  };
  stack?: string;
};

// Função centralizada para mensagens de erro amigáveis
export const getErrorMessage = (code?: string): string => {
  const errorMessages: Record<string, string> = {
    ECONNREFUSED: 'Serviço indisponível ou não respondendo',
    ETIMEDOUT: 'Tempo de resposta excedido',
    ECONNRESET: 'Conexão foi reiniciada pelo serviço',
    ENOTFOUND: 'Serviço não encontrado (verifique a URL)',
    DEFAULT: 'Erro na comunicação com o serviço'
  };
  return errorMessages[code || ''] || errorMessages.DEFAULT;
};

// Logger específico para os proxies
const proxyLog = {
  request: (service: string, method: string, url: string) => {
    console.log(
      chalk.gray(`[${new Date().toISOString()}]`), 
      chalk.blue(`[${service}]`), 
      chalk.yellow(`${method} ${url}`)
    );
  },
  
  response: (service: string, status: number, url: string, time: number) => {
    console.log(
      chalk.gray(`[${new Date().toISOString()}]`), 
      chalk.blue(`[${service}]`), 
      chalk.green(`${status}`), 
      chalk.yellow(`${url}`), 
      chalk.magenta(`${time}ms`)
    );
  },
  
  error: (service: string, error: ServiceError) => {
    console.error(
      chalk.gray(`[${new Date().toISOString()}]`), 
      chalk.red(`[${service} Error]`),
      chalk.yellow(`${error.code || 'NO_CODE'}`),
      getErrorMessage(error.code),
      chalk.gray(`URL: ${error.config?.url}`)
    );
  }
};

// Cria instância Axios com configurações robustas
const createAxiosInstance = (baseURL: string, serviceName: string) => {
  const instance = axios.create({
    baseURL,
    timeout: defaultTimeout,
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      "X-Service-Name": serviceName
    },
    httpAgent: new http.Agent({ 
      keepAlive: true,
      maxSockets: 50,
      timeout: defaultTimeout
    }),
    httpsAgent: new https.Agent({ 
      keepAlive: true,
      maxSockets: 50,
      timeout: defaultTimeout
    }),
    maxRedirects: 0,
    maxContentLength: 50 * 1024 * 1024 // 50MB
  });

  // Interceptor para logs de requisição
  instance.interceptors.request.use(config => {
    proxyLog.request(serviceName, config.method?.toUpperCase() || '', config.url || '');
    return config;
  }, error => {
    proxyLog.error(serviceName, error);
    return Promise.reject(error);
  });

  // Interceptor para logs de resposta
  instance.interceptors.response.use(response => {
    proxyLog.response(
      serviceName, 
      response.status, 
      response.config.url || '',
      Number(response.headers['x-response-time'] || 0)
    );
    return response;
  }, (error: ServiceError) => {
    const errorDetails = {
      ...error,
      service: serviceName,
      code: error.code || 'NO_ERROR_CODE',
      status: error.response?.status || 'NO_RESPONSE'
    };
    
    proxyLog.error(serviceName, errorDetails);
    return Promise.reject(errorDetails);
  });

  return instance;
};

// Configuração dos proxies para cada serviço
export const proxies = {
  auth: createAxiosInstance(
    process.env.AUTH_SERVICE_URL || "http://localhost:3000",
    "auth-service"
  ),
  user: createAxiosInstance(
    process.env.USER_SERVICE_URL || "http://localhost:3001",
    "user-service"
  ),
  booking: createAxiosInstance(
    process.env.BOOKING_SERVICE_URL || "http://localhost:3003",
    "booking-service"
  ),
  salon: createAxiosInstance(
    process.env.SALON_SERVICE_URL || "http://localhost:3002",
    "salon-service"
  ),
  notification: createAxiosInstance(
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004",
    "notification-service"
  ),
  images: createAxiosInstance(
    process.env.IMAGE_SERVICE_URL || "http://localhost:3005",
    "image-service"
  ),
};

// Verificação de saúde dos serviços
export const checkServicesHealth = async () => {
  const results: Record<string, any> = {};
  
  for (const [serviceName, instance] of Object.entries(proxies)) {
    try {
      const start = Date.now();
      const response = await instance.get('/health', { timeout: 5000 });
      const responseTime = Date.now() - start;
      
      results[serviceName] = {
        status: 'online',
        data: response.data,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      results[serviceName] = {
        status: 'offline',
        error: getErrorMessage(error.code),
        code: error.code,
        details: error.response?.data || null,
        timestamp: new Date().toISOString()
      };
    }
  }

  return results;
};