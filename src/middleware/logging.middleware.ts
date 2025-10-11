import { Request, Response, NextFunction } from "express";
import morgan from "morgan";

export const requestLogger = morgan((tokens, req, res) => {
  // ✅ CORREÇÃO: Substitua req.ip por uma alternativa
  const clientIP =
    req.headers["x-forwarded-for"] ||
    (req as any).socket?.remoteAddress ||
    "unknown";

  return [
    `[${new Date().toISOString()}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens["response-time"](req, res),
    "ms",
    "- IP:",
    clientIP, // ✅ Usando a alternativa corrigida
    req.headers["x-user-id"] ? `- User: ${req.headers["x-user-id"]}` : "",
  ].join(" ");
});

export const gatewayLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(
    `🚀 Gateway Routing: ${req.method} ${req.path} → ${
      req.headers["x-target-service"] || "Unknown Service"
    }`
  );
  next();
};
