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

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error(`Service ${serviceName} error:`, error.message);
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