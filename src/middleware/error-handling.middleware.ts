import { Request, Response, NextFunction } from 'express';

export interface GatewayError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: GatewayError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🚨 Gateway Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};