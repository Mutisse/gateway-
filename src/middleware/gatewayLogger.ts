import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '../services/Logging.Service';

const loggingService = new LoggingService();

export const gatewayLogger = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = uuidv4();
  
  // Adiciona correlation ID ao request
  req.headers['x-correlation-id'] = correlationId;

  // Captura dados básicos da requisição
  const logBase = {
    correlation_id: correlationId,
    timestamp_request: new Date(),
    http_method: req.method,
    request_url: req.url,
    client_ip: req.ip || req.connection.remoteAddress || 
               req.socket.remoteAddress || 'unknown',
    user_agent: req.get('User-Agent') || 'unknown',
    user_id: req.headers['x-user-id'] as string || undefined,
    target_microservice: 'gateway', // Será atualizado após o routing
    target_microservice_url: req.url,
    request_size_bytes: parseInt(req.get('Content-Length') || '0')
  };

  // Intercepta a resposta
  const originalSend = res.send;
  let responseBody: any;

  res.send = function(body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    try {
      const responseTimeMs = Date.now() - startTime;
      
      // Determina error_type baseado no status code
      let errorType = undefined;
      if (res.statusCode >= 500) {
        errorType = 'BACKEND_ERROR';
      } else if (res.statusCode === 504) {
        errorType = 'TIMEOUT';
      } else if (res.statusCode === 503) {
        errorType = 'CIRCUIT_BREAKER_OPEN';
      } else if (res.statusCode === 502) {
        errorType = 'CONNECTION_REFUSED';
      }

      // Prepara mensagem de erro se houver
      let errorMessage = undefined;
      if (res.statusCode >= 400 && responseBody) {
        try {
          const errorData = typeof responseBody === 'string' ? 
            JSON.parse(responseBody) : responseBody;
          errorMessage = errorData.message || errorData.error || 'Error';
        } catch {
          errorMessage = 'Error occurred';
        }
      }

      await loggingService.createLog({
        ...logBase,
        timestamp_response: new Date(),
        http_status_code: res.statusCode,
        response_time_ms: responseTimeMs,
        response_size_bytes: parseInt(res.get('Content-Length') || '0'),
        error_message: errorMessage,
        backend_status_code: res.statusCode,
        error_type: errorType,
        gateway_handled: res.statusCode >= 400
      });

    } catch (error) {
      console.error('Failed to save gateway log:', error);
      // Não falha a requisição principal se o logging falhar
    }
  });

  next();
};