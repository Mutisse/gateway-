import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    subRole?: string;
    isVerified: boolean;
  };
}

// Defina as rotas públicas diretamente no middleware
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/health",
  "/docs",
];

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip authentication for public routes
    if (PUBLIC_ROUTES.some((route) => req.path.startsWith(route))) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
        code: "MISSING_TOKEN",
      });
    }

    const token = authHeader.substring(7);

    try {
      // TODO: Implementar a verificação do token com o serviço de autenticação
      // Por enquanto, vamos decodificar o token localmente
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as any;

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        subRole: decoded.subRole,
        isVerified: decoded.isVerified,
      };

      next();
    } catch (error: any) {
      console.error("Token verification error:", error.message);

      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
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
        error: "Authentication required",
        code: "UNAUTHENTICATED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        code: "FORBIDDEN",
      });
    }

    next();
  };
};
