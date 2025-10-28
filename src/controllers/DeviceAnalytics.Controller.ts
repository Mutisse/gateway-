// controllers/DeviceAnalyticsController.ts
import { Request, Response } from "express";
import { DeviceAnalyticsService } from "../services/DeviceAnalytics.Service";
import { IDeviceAnalyticsService } from "../models/interfaces/IDeviceAnalytics";

export class DeviceAnalyticsController {
  private deviceAnalyticsService: IDeviceAnalyticsService;

  constructor() {
    this.deviceAnalyticsService = new DeviceAnalyticsService();
  }

  getDeviceAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analytics = await this.deviceAnalyticsService.getDeviceAnalytics(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analytics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getDeviceAnalytics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch device analytics",
      });
    }
  };

  getPlatformAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analytics = await this.deviceAnalyticsService.getPlatformAnalytics(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analytics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getPlatformAnalytics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch platform analytics",
      });
    }
  };

  getBrowserAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analytics = await this.deviceAnalyticsService.getBrowserAnalytics(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analytics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getBrowserAnalytics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch browser analytics",
      });
    }
  };

  getGeographicAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analytics = await this.deviceAnalyticsService.getGeographicAnalytics(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analytics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getGeographicAnalytics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch geographic analytics",
      });
    }
  };

  getPerformanceAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analytics = await this.deviceAnalyticsService.getPerformanceAnalytics(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analytics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getPerformanceAnalytics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch performance analytics",
      });
    }
  };

  getUserAgentAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = "24" } = req.query;
      const timeRangeHours = parseInt(hours as string);

      const analytics = await this.deviceAnalyticsService.getUserAgentAnalytics(timeRangeHours);

      res.status(200).json({
        success: true,
        data: analytics,
        timeRange: `${timeRangeHours} hours`,
      });
    } catch (error) {
      console.error("Error in getUserAgentAnalytics controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user agent analytics",
      });
    }
  };
}