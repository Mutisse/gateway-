import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { SERVICE_CONFIG } from './config';

export class HttpClient {
  private clients: Map<string, AxiosInstance> = new Map();

  constructor() {
    // Initialize HTTP clients for each service
    Object.entries(SERVICE_CONFIG).forEach(([serviceName, baseURL]) => {
      const client = axios.create({
        baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'gateway'
        }
      });

      // Add request interceptor for logging
      client.interceptors.request.use(
        (config) => {
          console.log(`🚀 Gateway → ${serviceName}: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
          return config;
        },
        (error) => {
          console.error(`❌ Gateway request error to ${serviceName}:`, error.message);
          return Promise.reject(error);
        }
      );

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => {
          console.log(`✅ Gateway ← ${serviceName}: ${response.status} ${response.statusText}`);
          return response;
        },
        (error) => {
          console.error(`❌ Gateway response error from ${serviceName}:`, {
            message: error.message,
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
          });
          throw error;
        }
      );

      this.clients.set(serviceName, client);
    });
  }

  async request(service: string, options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<AxiosResponse> {
    const client = this.clients.get(service);
    
    if (!client) {
      throw new Error(`Service ${service} not configured`);
    }

    return client.request({
      method: options.method,
      url: options.url,
      data: options.data,
      headers: options.headers
    });
  }

  // Convenience methods
  async get(service: string, url: string, headers?: Record<string, string>) {
    return this.request(service, { method: 'GET', url, headers });
  }

  async post(service: string, url: string, data: any, headers?: Record<string, string>) {
    return this.request(service, { method: 'POST', url, data, headers });
  }

  async put(service: string, url: string, data: any, headers?: Record<string, string>) {
    return this.request(service, { method: 'PUT', url, data, headers });
  }

  async delete(service: string, url: string, headers?: Record<string, string>) {
    return this.request(service, { method: 'DELETE', url, headers });
  }
}

export const httpClient = new HttpClient();

