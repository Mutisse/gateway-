// controllers/LoggingController.ts - ATUALIZADO
import { Request, Response } from "express";
import { LoggingService } from "../services/Logging.Service";
import { CreateLogData } from "../models/interfaces/ILoggingService";

export class LoggingController {
  private loggingService: LoggingService;

  constructor() {
    this.loggingService = new LoggingService();
  }

  createLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const logData: CreateLogData = req.body;
      const logEntry = await this.loggingService.createLog(logData);

      res.status(201).json({
        success: true,
        data: logEntry,
        message: "Log entry created successfully",
      });
    } catch (error) {
      console.error("Error in createLog controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create log entry",
      });
    }
  };

  getLogsByCorrelationId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { correlationId } = req.params;
      const logs = await this.loggingService.findLogsByCorrelationId(
        correlationId
      );

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      console.error("Error in getLogsByCorrelationId controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch logs",
      });
    }
  };

  // NOVO: Buscar logs com filtros
  getLogsByFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        startDate,
        endDate,
        statusCode,
        microservice,
        userId,
        correlationId,
      } = req.query;

      const logs = await this.loggingService.findLogsByFilters({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        statusCode: statusCode ? parseInt(statusCode as string) : undefined,
        microservice: microservice as string,
        userId: userId as string,
        correlationId: correlationId as string,
      });

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      console.error("Error in getLogsByFilters controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch logs",
      });
    }
  };

  // NOVO: Dashboard metrics
  getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const metrics = await this.loggingService.getDashboardMetrics(
        timeRangeHours
      );

      res.status(200).json({
        success: true,
        data: metrics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getDashboardMetrics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard metrics",
      });
    }
  };

  // Estatísticas gerais (já existente)
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const stats = await this.loggingService.getStats(timeRangeHours);

      res.status(200).json({
        success: true,
        data: stats,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
      });
    }
  };
}
