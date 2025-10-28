// controllers/ErrorTrackingController.ts
import { Request, Response } from "express";
import { ErrorTrackingService } from "../services/ErrorTracking.Service";

export class ErrorTrackingController {
  private errorService: ErrorTrackingService;

  constructor() {
    this.errorService = new ErrorTrackingService();
  }

  getErrorStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const stats = await this.errorService.getErrorStats(timeRangeHours);

      res.status(200).json({
        success: true,
        data: stats,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getErrorStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch error statistics",
      });
    }
  };

  getErrorAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analysis = await this.errorService.getErrorAnalysis(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analysis,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getErrorAnalysis controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch error analysis",
      });
    }
  };

  getMicroserviceErrors = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { microservice } = req.params;
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const errors = await this.errorService.getErrorsByMicroservice(
        microservice,
        timeRangeHours
      );

      res.status(200).json({
        success: true,
        data: errors,
        count: errors.length,
        microservice,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getMicroserviceErrors controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch microservice errors",
      });
    }
  };

  getCircuitBreakerStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const circuitBreakerStats =
        await this.errorService.getCircuitBreakerStats();

      res.status(200).json({
        success: true,
        data: circuitBreakerStats,
        message: "Circuit breaker status retrieved successfully",
      });
    } catch (error) {
      console.error("Error in getCircuitBreakerStatus controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch circuit breaker status",
      });
    }
  };
}
