import { Router } from "express";
import { httpClient } from "../utils/http-client";
import { authRateLimit } from "../middleware/rate-limiting.middleware";

const router = Router();

// ✅ ADICIONAR ROTA DE VERIFICAÇÃO DE EMAIL (DEVE SER A PRIMEIRA)
router.post("/check-email", authRateLimit, async (req, res, next) => {
  try {
    console.log("🔍 Gateway: Verificando se email existe:", req.body.email);
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/auth/check-email", // ✅ NOVA ROTA
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro na verificação de email:", error.message);
    next(error);
  }
});

// 🔐 AUTHENTICATION ROUTES ONLY - SEM REGISTER!
router.post("/login", authRateLimit, async (req, res, next) => {
  try {
    console.log("🔐 Gateway: Redirecionando login para User Service");
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/auth/login", // ✅ CORRETO - SEM /UserService/ duplicado
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no login:", error.message);
    next(error);
  }
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    console.log("🔄 Gateway: Refresh token solicitado");
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/auth/refresh-token", // ✅ CORRETO
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no refresh token:", error.message);
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    console.log("🚪 Gateway: Logout solicitado");

    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/auth/logout", // ✅ CORRETO
      req.body,
      Object.keys(headers).length > 0 ? headers : undefined
    );

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no logout:", error.message);
    next(error);
  }
});

// 🔑 PASSWORD RESET
router.post("/forgot-password", authRateLimit, async (req, res, next) => {
  try {
    console.log("📧 Gateway: Esqueci senha para:", req.body.email);
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/auth/forgot-password", // ✅ CORRETO
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no forgot password:", error.message);
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    console.log("🔑 Gateway: Resetar senha solicitado");
    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/auth/reset-password", // ✅ CORRETO
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no reset password:", error.message);
    next(error);
  }
});

export default router;
