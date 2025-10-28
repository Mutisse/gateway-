import { ILogEntry } from "../LogEntry";

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

export interface ILoggingService {
  createLog(logData: CreateLogData): Promise<ILogEntry>;
  findLogsByCorrelationId(correlationId: string): Promise<ILogEntry[]>;
  findLogsByFilters(filters: {
    startDate?: Date;
    endDate?: Date;
    statusCode?: number;
    microservice?: string;
    userId?: string;
  }): Promise<ILogEntry[]>;
  getErrorStats(timeRangeHours: number): Promise<any>;
}
