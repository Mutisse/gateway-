// interfaces/IDeviceAnalytics.ts

export interface DeviceStats {
  type: string;
  count: number;
  percentage: number;
  icon: string;
  color: string;
}

export interface PlatformStats {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface BrowserStats {
  name: string;
  version: string;
  count: number;
  percentage: number;
}

export interface GeographicStats {
  country: string;
  region: string;
  city: string;
  count: number;
  percentage: number;
}

export interface PerformanceStats {
  deviceType: string;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestCount: number;
}

export interface DeviceAnalytics {
  devices: DeviceStats[];
  platforms: PlatformStats[];
  browsers: BrowserStats[];
  geographic: GeographicStats[];
  performance: PerformanceStats[];
  totalAccesses: number;
  timestamp: Date;
}

export interface IDeviceAnalyticsService {
  getDeviceAnalytics(timeRangeHours?: number): Promise<DeviceAnalytics>;
  getPlatformAnalytics(timeRangeHours?: number): Promise<PlatformStats[]>;
  getBrowserAnalytics(timeRangeHours?: number): Promise<BrowserStats[]>;
  getGeographicAnalytics(timeRangeHours?: number): Promise<GeographicStats[]>;
  getPerformanceAnalytics(timeRangeHours?: number): Promise<PerformanceStats[]>;
  getUserAgentAnalytics(timeRangeHours?: number): Promise<any>;
}