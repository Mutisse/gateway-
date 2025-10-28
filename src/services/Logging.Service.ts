// services/Logging.Service.ts - ATUALIZADO
import { ILogEntry, LogEntry } from "../models/LogEntry";

export interface CreateLogData {
  correlation_id: string;
  timestamp_request: Date;
  timestamp_response: Date;
  http_method: string;
  request_url: string;
  http_status_code: number;
  response_time_ms: number;
  client_ip: string;
  user_agent: string;
  user_id?: string;
  target_microservice: string;
  target_microservice_url: string;
  error_message?: string;
  request_size_bytes: number;
  response_size_bytes: number;
  backend_status_code?: number;
  error_type?: string;
  gateway_handled?: boolean;
}

export interface LogFilters {
  startDate?: Date;
  endDate?: Date;
  statusCode?: number;
  microservice?: string;
  userId?: string;
  correlationId?: string;
}

export class LoggingService {
  async createLog(logData: CreateLogData): Promise<ILogEntry> {
    try {
      const logEntry = new LogEntry(logData);
      return await logEntry.save();
    } catch (error) {
      console.error("Error creating log entry:", error);
      throw error;
    }
  }

  async findLogsByCorrelationId(correlationId: string): Promise<ILogEntry[]> {
    return await LogEntry.find({ correlation_id: correlationId })
      .sort({ timestamp_request: -1 })
      .exec();
  }

  // NOVO MÉTODO: Buscar logs com filtros
  async findLogsByFilters(filters: LogFilters): Promise<ILogEntry[]> {
    const query: any = {};

    if (filters.startDate || filters.endDate) {
      query.timestamp_request = {};
      if (filters.startDate) query.timestamp_request.$gte = filters.startDate;
      if (filters.endDate) query.timestamp_request.$lte = filters.endDate;
    }

    if (filters.statusCode) query.http_status_code = filters.statusCode;
    if (filters.microservice) query.target_microservice = filters.microservice;
    if (filters.userId) query.user_id = filters.userId;
    if (filters.correlationId) query.correlation_id = filters.correlationId;

    return await LogEntry.find(query)
      .sort({ timestamp_request: -1 })
      .limit(1000) // Limite para não sobrecarregar
      .exec();
  }

  // NOVO MÉTODO: Estatísticas de erro
  async getErrorStats(timeRangeHours: number = 24): Promise<any> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    return await LogEntry.aggregate([
      {
        $match: {
          timestamp_request: { $gte: startDate },
          $or: [
            { http_status_code: { $gte: 400 } },
            { error_type: { $ne: null } },
          ],
        },
      },
      {
        $group: {
          _id: {
            errorType: "$error_type",
            statusCode: "$http_status_code",
            microservice: "$target_microservice",
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$response_time_ms" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }

  async getStats(timeRangeHours: number = 24): Promise<any> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    const stats = await LogEntry.aggregate([
      {
        $match: {
          timestamp_request: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            statusCode: "$http_status_code",
            microservice: "$target_microservice",
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$response_time_ms" },
          maxResponseTime: { $max: "$response_time_ms" },
        },
      },
      {
        $project: {
          _id: 0,
          statusCode: "$_id.statusCode",
          microservice: "$_id.microservice",
          count: 1,
          avgResponseTime: 1,
          maxResponseTime: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return stats;
  }

  // NOVO MÉTODO: Métricas gerais
  async getDashboardMetrics(timeRangeHours: number = 24): Promise<any> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    const metrics = await LogEntry.aggregate([
      {
        $match: {
          timestamp_request: { $gte: startDate },
        },
      },
      {
        $facet: {
          totalRequests: [{ $count: "count" }],
          errorRequests: [
            {
              $match: {
                $or: [
                  { http_status_code: { $gte: 400 } },
                  { error_type: { $ne: null } },
                ],
              },
            },
            { $count: "count" },
          ],
          byMicroservice: [
            {
              $group: {
                _id: "$target_microservice",
                count: { $sum: 1 },
                avgResponseTime: { $avg: "$response_time_ms" },
              },
            },
          ],
          byStatusCode: [
            {
              $group: {
                _id: "$http_status_code",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const total = metrics[0]?.totalRequests[0]?.count || 0;
    const errors = metrics[0]?.errorRequests[0]?.count || 0;

    return {
      totalRequests: total,
      errorRequests: errors,
      successRate:
        total > 0 ? (((total - errors) / total) * 100).toFixed(2) : 100,
      byMicroservice: metrics[0]?.byMicroservice || [],
      byStatusCode: metrics[0]?.byStatusCode || [],
    };
  }
}
