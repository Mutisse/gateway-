"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkServicesHealth = exports.proxies = exports.getErrorMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const chalk_1 = __importDefault(require("chalk"));
// Configurações de timeout ajustáveis
const defaultTimeout = Number(process.env.PROXY_TIMEOUT) || 120000; // 2 minutos
// Função centralizada para mensagens de erro amigáveis
const getErrorMessage = (code) => {
    const errorMessages = {
        ECONNREFUSED: 'Serviço indisponível ou não respondendo',
        ETIMEDOUT: 'Tempo de resposta excedido',
        ECONNRESET: 'Conexão foi reiniciada pelo serviço',
        ENOTFOUND: 'Serviço não encontrado (verifique a URL)',
        DEFAULT: 'Erro na comunicação com o serviço'
    };
    return errorMessages[code || ''] || errorMessages.DEFAULT;
};
exports.getErrorMessage = getErrorMessage;
// Logger específico para os proxies
const proxyLog = {
    request: (service, method, url) => {
        console.log(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.blue(`[${service}]`), chalk_1.default.yellow(`${method} ${url}`));
    },
    response: (service, status, url, time) => {
        console.log(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.blue(`[${service}]`), chalk_1.default.green(`${status}`), chalk_1.default.yellow(`${url}`), chalk_1.default.magenta(`${time}ms`));
    },
    error: (service, error) => {
        console.error(chalk_1.default.gray(`[${new Date().toISOString()}]`), chalk_1.default.red(`[${service} Error]`), chalk_1.default.yellow(`${error.code || 'NO_CODE'}`), (0, exports.getErrorMessage)(error.code), chalk_1.default.gray(`URL: ${error.config?.url}`));
    }
};
// Cria instância Axios com configurações robustas
const createAxiosInstance = (baseURL, serviceName) => {
    const instance = axios_1.default.create({
        baseURL,
        timeout: defaultTimeout,
        headers: {
            "Content-Type": "application/json",
            "Connection": "keep-alive",
            "X-Service-Name": serviceName
        },
        httpAgent: new http_1.default.Agent({
            keepAlive: true,
            maxSockets: 50,
            timeout: defaultTimeout
        }),
        httpsAgent: new https_1.default.Agent({
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
        proxyLog.response(serviceName, response.status, response.config.url || '', Number(response.headers['x-response-time'] || 0));
        return response;
    }, (error) => {
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
exports.proxies = {
    auth: createAxiosInstance(process.env.AUTH_SERVICE_URL || "http://localhost:3000", "auth-service"),
    user: createAxiosInstance(process.env.USER_SERVICE_URL || "http://localhost:3001", "user-service"),
    booking: createAxiosInstance(process.env.BOOKING_SERVICE_URL || "http://localhost:3003", "booking-service"),
    salon: createAxiosInstance(process.env.SALON_SERVICE_URL || "http://localhost:3002", "salon-service"),
    notification: createAxiosInstance(process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004", "notification-service"),
    images: createAxiosInstance(process.env.IMAGE_SERVICE_URL || "http://localhost:3005", "image-service"),
};
// Verificação de saúde dos serviços
const checkServicesHealth = async () => {
    const results = {};
    for (const [serviceName, instance] of Object.entries(exports.proxies)) {
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
        }
        catch (error) {
            results[serviceName] = {
                status: 'offline',
                error: (0, exports.getErrorMessage)(error.code),
                code: error.code,
                details: error.response?.data || null,
                timestamp: new Date().toISOString()
            };
        }
    }
    return results;
};
exports.checkServicesHealth = checkServicesHealth;
