// gateway/src/controllers/Diagnostic.controller.ts
import { Request, Response } from 'express';
import { gatewayDiagnostic } from '../utils/diagnostics/gatewayDiagnostic';
import axios from 'axios';

export class DiagnosticController {
  
  /**
   * Diagnóstico completo do gateway
   */
  public async getFullDiagnostic(req: Request, res: Response) {
    try {
      const diagnostic = await gatewayDiagnostic.fullDiagnostic();
      res.json(diagnostic);
    } catch (error: any) {
      res.status(500).json({
        error: 'Diagnostic failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Diagnóstico rápido do gateway
   */
  public async getQuickDiagnostic(req: Request, res: Response) {
    try {
      const diagnostic = await gatewayDiagnostic.quickDiagnostic();
      res.json(diagnostic);
    } catch (error: any) {
      res.status(500).json({
        error: 'Quick diagnostic failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Diagnóstico de todos os serviços
   */
  public async getAllServicesDiagnostic(req: Request, res: Response) {
    try {
      const services = ['auth', 'notifications', 'scheduling', 'payments', 'analytics'];
      const results = await gatewayDiagnostic.bulkServicesDiagnostic(services);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({
        error: 'Services diagnostic failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Status do gateway com estatísticas
   */
  public async getGatewayStats(req: Request, res: Response) {
    try {
      const stats = gatewayDiagnostic.getGatewayStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to get gateway stats',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Verificar dependências críticas
   */
  public async getCriticalDependencies(req: Request, res: Response) {
    try {
      const dependencies = await gatewayDiagnostic.checkCriticalDependencies();
      res.json(dependencies);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to check critical dependencies',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Diagnóstico de um serviço específico
   */
  public async getServiceDiagnostic(req: Request, res: Response) {
    try {
      const { serviceName } = req.params;
      const diagnostic = await gatewayDiagnostic.serviceDiagnostic(serviceName);
      res.json(diagnostic);
    } catch (error: any) {
      res.status(500).json({
        error: `Diagnostic failed for service: ${req.params.serviceName}`,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}