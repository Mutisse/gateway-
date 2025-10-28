import { Document, Schema, model } from "mongoose";

export interface ILogEntry extends Document {
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

const LogEntrySchema = new Schema<ILogEntry>(
  {
    correlation_id: {
      type: String,
      required: true,
      index: true,
    },
    timestamp_request: {
      type: Date,
      required: true,
      index: true,
    },
    timestamp_response: {
      type: Date,
      required: true,
    },
    http_method: {
      type: String,
      required: true,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    },
    request_url: {
      type: String,
      required: true,
      index: true,
    },
    http_status_code: {
      type: Number,
      required: true,
      index: true,
    },
    response_time_ms: {
      type: Number,
      required: true,
    },
    client_ip: {
      type: String,
      required: true,
    },
    user_agent: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      index: true,
    },
    target_microservice: {
      type: String,
      required: true,
      index: true,
    },
    target_microservice_url: {
      type: String,
      required: true,
    },
    error_message: {
      type: String,
    },
    request_size_bytes: {
      type: Number,
      required: true,
    },
    response_size_bytes: {
      type: Number,
      required: true,
    },
    backend_status_code: {
      type: Number,
    },
    // Seu modelo já está bom, mas verifique se o enum de error_type está completo:
    error_type: {
      type: String,
      enum: [
        "TIMEOUT",
        "CIRCUIT_BREAKER_OPEN",
        "CONNECTION_REFUSED",
        "BACKEND_ERROR",
        "VALIDATION_ERROR",
        "AUTH_ERROR",
        null,
      ],
    },
    gateway_handled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para performance
LogEntrySchema.index({ timestamp_request: -1, http_status_code: 1 });
LogEntrySchema.index({ target_microservice: 1, timestamp_request: -1 });
LogEntrySchema.index({ user_id: 1, timestamp_request: -1 });

export const LogEntry = model<ILogEntry>("LogEntry", LogEntrySchema);
