// services/ErrorTrackingService.ts
import { LogEntry, ILogEntry } from "../models/LogEntry";

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByMicroservice: Record<string, number>;
  errorsByStatusCode: Record<string, number>;
  recentErrors: ILogEntry[];
  errorRate: number;
  timeRange: string;
}

export interface ErrorAnalysis {
  mostCommonErrors: Array<{ errorType: string; count: number }>;
  microservicesMostErrors: Array<{ microservice: string; errorCount: number }>;
  peakErrorTimes: Array<{ hour: string; errorCount: number }>;
  resolutionTime: number;
  totalErrors: number;
}

export class ErrorTrackingService {
  async getErrorStats(timeRangeHours: number = 24): Promise<ErrorStats> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    const [errorLogs, totalLogs] = await Promise.all([
      LogEntry.find({
        timestamp_request: { $gte: startDate },
        $or: [
          { http_status_code: { $gte: 400 } },
          { error_type: { $ne: null } },
          { error_message: { $ne: null } },
        ],
      })
        .sort({ timestamp_request: -1 })
        .limit(1000),
      LogEntry.countDocuments({
        timestamp_request: { $gte: startDate },
      }),
    ]);

    const errorsByType = this.groupBy(errorLogs, "error_type");
    const errorsByMicroservice = this.groupBy(errorLogs, "target_microservice");
    const errorsByStatusCode = this.groupByStatusCode(errorLogs);

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      errorsByMicroservice,
      errorsByStatusCode,
      recentErrors: errorLogs.slice(0, 50),
      errorRate:
        totalLogs > 0
          ? Number(((errorLogs.length / totalLogs) * 100).toFixed(2))
          : 0,
      timeRange: `${timeRangeHours} hours`,
    };
  }

  async getErrorAnalysis(timeRangeHours: number = 24): Promise<ErrorAnalysis> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    const errorLogs = await LogEntry.find({
      timestamp_request: { $gte: startDate },
      $or: [{ http_status_code: { $gte: 400 } }, { error_type: { $ne: null } }],
    });

    const errorTypeCounts = this.countByProperty(errorLogs, "error_type");
    const mostCommonErrors = Object.entries(errorTypeCounts)
      .map(([errorType, count]) => ({ errorType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const microserviceCounts = this.countByProperty(
      errorLogs,
      "target_microservice"
    );
    const microservicesMostErrors = Object.entries(microserviceCounts)
      .map(([microservice, errorCount]) => ({ microservice, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount);

    const hourlyErrors = this.groupErrorsByHour(errorLogs);
    const peakErrorTimes = Object.entries(hourlyErrors)
      .map(([hour, errorCount]) => ({ hour: `${hour}:00`, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);

    const resolutionTime = await this.calculateAverageResolutionTime(errorLogs);

    return {
      mostCommonErrors,
      microservicesMostErrors,
      peakErrorTimes,
      resolutionTime,
      totalErrors: errorLogs.length,
    };
  }

  async getErrorsByMicroservice(
    microservice: string,
    timeRangeHours: number = 24
  ): Promise<ILogEntry[]> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    return await LogEntry.find({
      target_microservice: microservice,
      timestamp_request: { $gte: startDate },
      $or: [{ http_status_code: { $gte: 400 } }, { error_type: { $ne: null } }],
    })
      .sort({ timestamp_request: -1 })
      .limit(200);
  }

  async getCircuitBreakerStats(timeRangeHours: number = 24): Promise<any> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    return await LogEntry.aggregate([
      {
        $match: {
          timestamp_request: { $gte: startDate },
          error_type: "CIRCUIT_BREAKER_OPEN",
        },
      },
      {
        $group: {
          _id: "$target_microservice",
          count: { $sum: 1 },
          lastOccurrence: { $max: "$timestamp_request" },
          examples: {
            $push: {
              correlation_id: "$correlation_id",
              timestamp: "$timestamp_request",
              request_url: "$request_url",
            },
          },
        },
      },
      {
        $project: {
          microservice: "$_id",
          count: 1,
          lastOccurrence: 1,
          examples: { $slice: ["$examples", 5] },
        },
      },
    ]);
  }

  // MÉTODOS AUXILIARES COM TIPAGEM CORRETA
  private groupBy(array: any[], property: string): Record<string, number> {
    const result: Record<string, number> = {};

    array.forEach((obj) => {
      const key = String(obj[property] || "unknown");
      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }

  private groupByStatusCode(array: ILogEntry[]): Record<string, number> {
    const result: Record<string, number> = {};

    array.forEach((obj) => {
      const key = String(obj.http_status_code || "unknown");
      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }

  private countByProperty(
    array: any[],
    property: string
  ): Record<string, number> {
    const result: Record<string, number> = {};

    array.forEach((obj) => {
      const key = String(obj[property] || "unknown");
      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }

  private groupErrorsByHour(errorLogs: ILogEntry[]): Record<string, number> {
    const result: Record<string, number> = {};

    errorLogs.forEach((log) => {
      const hour = new Date(log.timestamp_request)
        .getHours()
        .toString()
        .padStart(2, "0");
      result[hour] = (result[hour] || 0) + 1;
    });

    return result;
  }

  private async calculateAverageResolutionTime(
    errorLogs: ILogEntry[]
  ): Promise<number> {
    // Para logs de erro, usamos o response_time como proxy do tempo de resolução
    if (errorLogs.length === 0) return 0;

    const totalResponseTime = errorLogs.reduce((total, log) => {
      return total + log.response_time_ms;
    }, 0);

    return Number((totalResponseTime / errorLogs.length).toFixed(2));
  }
}
