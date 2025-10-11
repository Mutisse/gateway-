import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { httpClient } from '../utils/http-client';
import { ROUTES_CONFIG } from '../utils/config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    subRole?: string;
    isVerified: boolean;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for public routes
    if (ROUTES_CONFIG.PUBLIC_ROUTES.some(route => req.path.startsWith(route))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify token with auth service
      const response = await httpClient.post('AUTH_USERS_SERVICE', '/auth/verify-token', { token });
      
      if (response.data.success) {
        req.user = response.data.data.user;
        next();
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};