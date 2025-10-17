import { Router, Request, Response } from "express";
import { emailCache } from "../utils/emailCache";
import { serviceCommunicator } from "../utils/service-communicator";

const router = Router();

// ✅ ROTA ALTERNATIVA COM CACHE PARA CHECK-EMAIL
router.post("/check-email-cached", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email é obrigatório",
        code: "EMAIL_REQUIRED",
      });
    }

    // ✅ VERIFICAR CACHE PRIMEIRO
    const cached = emailCache.get(email);
    if (cached) {
      console.log(
        `✅ Email verificado via CACHE: ${email} - Existe: ${cached.exists}`
      );
      return res.json({
        success: true,
        data: {
          exists: cached.exists,
          fromCache: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log(`🔍 Verificando email no serviço: ${email}`);

    // ✅ SE NÃO ESTIVER EM CACHE, CHAMAR O SERVIÇO
    const response = await serviceCommunicator.makeRequest(
      "AUTH_USERS_SERVICE",
      "/auth/check-email",
      "POST",
      { email }
    );

    // ✅ SALVAR NO CACHE
    emailCache.set(email, response.exists);

    console.log(
      `✅ Email verificado via SERVIÇO: ${email} - Existe: ${response.exists}`
    );

    res.json({
      success: true,
      data: {
        exists: response.exists,
        fromCache: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error(`❌ Erro na verificação de email: ${error.message}`);

    // ✅ SE O SERVIÇO ESTIVER COM RATE LIMIT, TENTAR USAR CACHE COMO FALLBACK
    if (error.status === 429) {
      const cached = emailCache.get(req.body.email);
      if (cached) {
        console.log(
          `🔄 Usando cache como fallback para rate limit: ${req.body.email}`
        );
        return res.json({
          success: true,
          data: {
            exists: cached.exists,
            fromCache: true,
            fromFallback: true,
            timestamp: new Date().toISOString(),
            note: "Serviço temporariamente indisponível - usando cache",
          },
        });
      }

      return res.status(429).json({
        success: false,
        error:
          "Serviço de verificação de email temporariamente indisponível. Tente novamente em alguns minutos.",
        code: "SERVICE_RATE_LIMITED",
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Erro interno ao verificar email",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ ENDPOINT PARA LIMPAR CACHE (APENAS DESENVOLVIMENTO)
if (process.env.NODE_ENV === "development") {
  router.delete("/cache", (req: Request, res: Response) => {
    emailCache.clear();
    res.json({
      success: true,
      message: "Cache de emails limpo",
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/cache/status", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        cacheSize: "N/A", // O Map não tem length, seria complexo implementar
        ttl: "5 minutos",
        environment: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

export default router;
