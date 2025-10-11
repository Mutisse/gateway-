import { Router } from "express";
import { serviceDiagnostic } from "../utils/service-diagnostic";
import { serviceCommunicator } from "../utils/service-communicator"; // ✅ Caminho correto

const router = Router();

// 🎯 TODAS AS ROTAS DE DIAGNÓSTICO SÃO PÚBLICAS
router.get("/diagnostic/full", async (req, res) => {
  try {
    console.log("🔍 Executando diagnóstico completo...");
    const diagnostic = await serviceDiagnostic.runFullDiagnostic();

    res.json({
      success: true,
      message: "Diagnóstico executado com sucesso",
      data: diagnostic,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao executar diagnóstico",
      details: error.message,
    });
  }
});

router.get("/diagnostic/service/:serviceName", async (req, res) => {
  try {
    const { serviceName } = req.params;
    console.log(`🔍 Diagnosticando serviço: ${serviceName}`);

    const diagnostic = await serviceDiagnostic.diagnoseService(serviceName);

    res.json({
      success: true,
      message: `Diagnóstico do serviço ${serviceName} concluído`,
      data: diagnostic,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao diagnosticar serviço",
      details: error.message,
    });
  }
});

router.get("/diagnostic/connectivity/:serviceName", async (req, res) => {
  try {
    const { serviceName } = req.params;
    console.log(`🔗 Testando conectividade: ${serviceName}`);

    const connectivity = await serviceDiagnostic.testConnectivity(serviceName);

    res.json({
      success: true,
      message: `Teste de conectividade para ${serviceName} concluído`,
      data: connectivity,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao testar conectividade",
      details: error.message,
    });
  }
});

router.get("/diagnostic/health-report", async (req, res) => {
  try {
    console.log("📊 Gerando relatório de saúde...");
    const healthReport = await serviceDiagnostic.generateHealthReport();

    res.json({
      success: true,
      message: "Relatório de saúde gerado com sucesso",
      data: healthReport,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao gerar relatório de saúde",
      details: error.message,
    });
  }
});

// 🎯 NOVA ROTA: STATUS SIMPLES DOS SERVIÇOS
router.get("/diagnostic/status", async (req, res) => {
  try {
    const servicesHealth = await serviceCommunicator.checkAllServicesHealth();

    // ✅ CORREÇÃO: Adicionar tipos explicitamente
    const status = {
      timestamp: new Date().toISOString(),
      services: servicesHealth.map((service: any) => ({
        // ✅ Tipo adicionado
        name: service.service,
        status: service.status,
        responseTime: service.responseTime,
      })),
      summary: {
        total: servicesHealth.length,
        healthy: servicesHealth.filter((s: any) => s.status === "healthy")
          .length, // ✅ Tipo adicionado
        unhealthy: servicesHealth.filter((s: any) => s.status === "unhealthy")
          .length, // ✅ Tipo adicionado
      },
    };

    res.json({
      success: true,
      message: "Status dos serviços",
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Falha ao obter status",
      details: error.message,
    });
  }
});

export default router;
