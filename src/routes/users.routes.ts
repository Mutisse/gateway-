import { Router } from "express";
import { httpClient } from "../utils/http-client";

const router = Router();

// 🎯 MIDDLEWARE DE LOG PARA TODAS AS ROTAS
router.use((req, res, next) => {
  console.log(`📝 Gateway [Users]: ${req.method} ${req.path}`);
  next();
});

// =============================================
// 👥 ROTAS DE CLIENTES
// =============================================

// ✅ REGISTRO DE CLIENTES
router.post("/clients/register", async (req, res, next) => {
  try {
    console.log(
      "📝 Gateway: Redirecionando /api/clients/register para User Service"
    );

    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/clients/register", // ✅ CORRETO
      req.body
    );

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("❌ Gateway: Erro no registro de cliente:", error.message);
    next(error);
  }
});

// ✅ PERFIL E GERENCIAMENTO DE CLIENTES
router.get("/clients/profile", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/clients/profile", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/clients/profile", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: "/clients/profile", // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/clients/preferences", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: "/clients/preferences", // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ PONTOS DE FIDELIDADE
router.patch("/clients/:clientId/loyalty-points", async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/clients/${clientId}/loyalty-points`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ AGENDAMENTOS
router.post("/clients/:clientId/appointments", async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      `/clients/${clientId}/appointments`, // ✅ CORRETO
      req.body,
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ ADMIN - GESTÃO DE CLIENTES
router.get("/clients", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/clients", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/clients/:clientId", async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      `/clients/${clientId}`, // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/clients/:clientId/status", async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/clients/${clientId}/status`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// =============================================
// 👨‍💼 ROTAS DE FUNCIONÁRIOS
// =============================================

// ✅ REGISTRO DE FUNCIONÁRIOS
router.post("/employees/register", async (req, res, next) => {
  try {
    console.log(
      "📝 Gateway: Redirecionando /api/employees/register para User Service"
    );

    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/employees/register", // ✅ CORRETO
      req.body
    );

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(
      "❌ Gateway: Erro no registro de funcionário:",
      error.message
    );
    next(error);
  }
});

// ✅ PERFIL DE FUNCIONÁRIOS
router.get("/employees/profile", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/employees/profile", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/employees/profile", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: "/employees/profile", // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ AGENDA E DISPONIBILIDADE
router.patch("/employees/schedule/:employeeId", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/employees/schedule/${employeeId}`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/employees/availability/:employeeId", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/employees/availability/${employeeId}`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ ROTAS PÚBLICAS - FUNCIONÁRIOS
router.get("/employees/list", async (req, res, next) => {
  try {
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/employees/list" // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/employees/available", async (req, res, next) => {
  try {
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/employees/available" // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/employees/:employeeId/public", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      `/employees/${employeeId}/public` // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ AVALIAÇÕES DE FUNCIONÁRIOS
router.patch("/employees/:employeeId/rating", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/employees/${employeeId}/rating`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ ADMIN - GESTÃO DE FUNCIONÁRIOS
router.get("/employees", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/employees", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/employees/:employeeId", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      `/employees/${employeeId}`, // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/employees/:employeeId/admin", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/employees/${employeeId}/admin`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.delete("/employees/:employeeId", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.delete(
      "AUTH_USERS_SERVICE",
      `/employees/${employeeId}`, // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// =============================================
// 👑 ROTAS DE ADMINISTRADORES
// =============================================

// ✅ REGISTRO DE ADMIN (PROTEGIDO)
router.post("/admins/register", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.post(
      "AUTH_USERS_SERVICE",
      "/admins/register", // ✅ CORRETO
      req.body,
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ PERFIL DE ADMIN
router.get("/admins/profile", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/admins/profile", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/admins/profile", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: "/admins/profile", // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ ADMIN - ESTATÍSTICAS DO SISTEMA
router.get("/admins/system-stats", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/admins/system-stats", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ ADMIN - GESTÃO DE USUÁRIOS
router.get("/admins/users", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/admins/users", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/admins/users/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      `/admins/users/${userId}`, // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/admins/manage-user/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/admins/manage-user/${userId}`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.patch("/admins/users/:userId/status", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.request("AUTH_USERS_SERVICE", {
      method: "PATCH",
      url: `/admins/users/${userId}/status`, // ✅ CORRETO
      data: req.body,
      headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.delete("/admins/users/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.delete(
      "AUTH_USERS_SERVICE",
      `/admins/users/${userId}`, // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// ✅ ADMIN - BACKUP E LOGS
router.get("/admins/backup", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/admins/backup", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/admins/logs", async (req, res, next) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers["Authorization"] = String(req.headers.authorization);
    }

    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/admins/logs", // ✅ CORRETO
      headers
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// =============================================
// 🏥 HEALTH CHECKS
// =============================================

router.get("/health", async (req, res, next) => {
  try {
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/health" // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/clients/health", async (req, res, next) => {
  try {
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/clients/health" // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/employees/health", async (req, res, next) => {
  try {
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/employees/health" // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

router.get("/admins/health", async (req, res, next) => {
  try {
    const response = await httpClient.get(
      "AUTH_USERS_SERVICE",
      "/admins/health" // ✅ CORRETO
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    next(error);
  }
});

// =============================================
// 🛡️ MIDDLEWARE DE ERRO GLOBAL
// =============================================

router.use((error: any, req: any, res: any, next: any) => {
  console.error("💥 Gateway [Users]: Erro global:", {
    message: error.message,
    url: req.url,
    method: req.method,
  });

  if (error.response) {
    return res.status(error.response.status).json(error.response.data);
  }

  res.status(500).json({
    error: "Internal Gateway Error",
    message: "Erro interno no gateway de usuários",
    timestamp: new Date().toISOString(),
  });
});

export default router;
