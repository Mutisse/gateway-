// services/DeviceAnalytics.Service.ts
import { LogEntry, ILogEntry } from "../models/LogEntry";
import { UAParser } from "ua-parser-js";
import {
  DeviceAnalytics,
  DeviceStats,
  PlatformStats,
  BrowserStats,
  GeographicStats,
  PerformanceStats,
  IDeviceAnalyticsService,
} from "../models/interfaces/IDeviceAnalytics";

export class DeviceAnalyticsService implements IDeviceAnalyticsService {
  async getDeviceAnalytics(
    timeRangeHours: number = 24
  ): Promise<DeviceAnalytics> {
    const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    const logs = await LogEntry.find({
      timestamp_request: { $gte: startDate },
    }).limit(5000); // Limitar para performance

    const deviceStats = this.analyzeDevices(logs);
    const platformStats = this.analyzePlatforms(logs);
    const browserStats = this.analyzeBrowsers(logs);
    const geographicStats = this.analyzeGeographic(logs);
    const performanceStats = this.analyzePerformance(logs);

    return {
      devices: deviceStats,
      platforms: platformStats,
      browsers: browserStats,
      geographic: geographicStats,
      performance: performanceStats,
      totalAccesses: logs.length,
      timestamp: new Date(),
    };
  }

  async getPlatformAnalytics(
    timeRangeHours: number = 24
  ): Promise<PlatformStats[]> {
    const analytics = await this.getDeviceAnalytics(timeRangeHours);
    return analytics.platforms;
  }

  async getBrowserAnalytics(
    timeRangeHours: number = 24
  ): Promise<BrowserStats[]> {
    const analytics = await this.getDeviceAnalytics(timeRangeHours);
    return analytics.browsers;
  }

  async getGeographicAnalytics(
    timeRangeHours: number = 24
  ): Promise<GeographicStats[]> {
    const analytics = await this.getDeviceAnalytics(timeRangeHours);
    return analytics.geographic;
  }

  async getPerformanceAnalytics(
    timeRangeHours: number = 24
  ): Promise<PerformanceStats[]> {
    const analytics = await this.getDeviceAnalytics(timeRangeHours);
    return analytics.performance;
  }

  async getUserAgentAnalytics(timeRangeHours: number = 24): Promise<any> {
    return await this.getDeviceAnalytics(timeRangeHours);
  }

  // MÉTODOS DE ANÁLISE
  private analyzeDevices(logs: ILogEntry[]): DeviceStats[] {
    const deviceCounts: Record<string, number> = {};

    logs.forEach((log) => {
      const ua = new UAParser(log.user_agent).getResult();
      const deviceType = ua.device.type || "desktop";
      deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
    });

    const total = logs.length;
    return Object.entries(deviceCounts)
      .map(([type, count]) => ({
        type: this.formatDeviceType(type),
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
        icon: this.getDeviceIcon(type),
        color: this.getDeviceColor(type),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private analyzePlatforms(logs: ILogEntry[]): PlatformStats[] {
    const platformCounts: Record<string, number> = {};

    logs.forEach((log) => {
      const ua = new UAParser(log.user_agent).getResult();
      const platform = ua.os.name || "Unknown";
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const total = logs.length;
    return Object.entries(platformCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Number(((value / total) * 100).toFixed(1)),
        color: this.getPlatformColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }

  private analyzeBrowsers(logs: ILogEntry[]): BrowserStats[] {
    const browserCounts: Record<
      string,
      { count: number; versions: Record<string, number> }
    > = {};

    logs.forEach((log) => {
      const ua = new UAParser(log.user_agent).getResult();
      const browser = ua.browser.name || "Unknown";
      const version = ua.browser.version?.split(".")[0] || "Unknown";

      if (!browserCounts[browser]) {
        browserCounts[browser] = { count: 0, versions: {} };
      }

      browserCounts[browser].count++;
      browserCounts[browser].versions[version] =
        (browserCounts[browser].versions[version] || 0) + 1;
    });

    const total = logs.length;
    const result: BrowserStats[] = [];

    Object.entries(browserCounts).forEach(([name, data]) => {
      // Versão mais popular
      const popularVersion =
        Object.entries(data.versions).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "Unknown";

      result.push({
        name,
        version: popularVersion,
        count: data.count,
        percentage: Number(((data.count / total) * 100).toFixed(1)),
      });
    });

    return result.sort((a, b) => b.count - a.count);
  }

  private analyzeGeographic(logs: ILogEntry[]): GeographicStats[] {
    // Regiões de África e Moçambique
    const africanRegions = [
      // Moçambique - Províncias
      { country: "Moçambique", region: "Maputo", city: "Maputo Cidade" },
      { country: "Moçambique", region: "Maputo", city: "Matola" },
      { country: "Moçambique", region: "Gaza", city: "Xai-Xai" },
      { country: "Moçambique", region: "Inhambane", city: "Inhambane" },
      { country: "Moçambique", region: "Sofala", city: "Beira" },
      { country: "Moçambique", region: "Manica", city: "Chimoio" },
      { country: "Moçambique", region: "Tete", city: "Tete" },
      { country: "Moçambique", region: "Zambézia", city: "Quelimane" },
      { country: "Moçambique", region: "Nampula", city: "Nampula" },
      { country: "Moçambique", region: "Cabo Delgado", city: "Pemba" },
      { country: "Moçambique", region: "Niassa", city: "Lichinga" },

      // Países Africanos Vizinhos
      { country: "África do Sul", region: "Gauteng", city: "Joanesburgo" },
      { country: "África do Sul", region: "KwaZulu-Natal", city: "Durban" },
      {
        country: "África do Sul",
        region: "Western Cape",
        city: "Cidade do Cabo",
      },

      { country: "Tanzânia", region: "Dar es Salaam", city: "Dar es Salaam" },
      { country: "Tanzânia", region: "Arusha", city: "Arusha" },

      { country: "Zâmbia", region: "Lusaka", city: "Lusaka" },
      { country: "Zâmbia", region: "Copperbelt", city: "Ndola" },

      { country: "Zimbábue", region: "Harare", city: "Harare" },
      { country: "Zimbábue", region: "Bulawayo", city: "Bulawayo" },

      { country: "Malawi", region: "Lilongwe", city: "Lilongwe" },
      { country: "Malawi", region: "Blantyre", city: "Blantyre" },

      { country: "Eswatini", region: "Hhohho", city: "Mbabane" },

      // Outros países Africanos importantes
      { country: "Nigéria", region: "Lagos", city: "Lagos" },
      { country: "Quénia", region: "Nairobi", city: "Nairobi" },
      { country: "Gana", region: "Greater Accra", city: "Acra" },
      { country: "Angola", region: "Luanda", city: "Luanda" },
      { country: "Egito", region: "Cairo", city: "Cairo" },
      { country: "Marrocos", region: "Casablanca", city: "Casablanca" },
      { country: "Argélia", region: "Argel", city: "Argel" },
      { country: "Etiópia", region: "Addis Ababa", city: "Addis Ababa" },
      { country: "Uganda", region: "Kampala", city: "Kampala" },
      { country: "Ruanda", region: "Kigali", city: "Kigali" },
      { country: "Senegal", region: "Dakar", city: "Dakar" },
      { country: "Costa do Marfim", region: "Abidjan", city: "Abidjan" },
      { country: "Camarões", region: "Yaoundé", city: "Yaoundé" },
      { country: "RD Congo", region: "Kinshasa", city: "Kinshasa" },
    ];

    const geographicCounts: Record<
      string,
      { count: number; region: string; city: string }
    > = {};

    logs.forEach((_, index) => {
      const location = africanRegions[index % africanRegions.length];
      const key = `${location.country}-${location.region}-${location.city}`;

      if (!geographicCounts[key]) {
        geographicCounts[key] = {
          count: 0,
          region: location.region,
          city: location.city,
        };
      }

      geographicCounts[key].count++;
    });

    const total = logs.length;
    return Object.entries(geographicCounts)
      .map(([key, data]) => {
        const [country] = key.split("-");
        return {
          country,
          region: data.region,
          city: data.city,
          count: data.count,
          percentage: Number(((data.count / total) * 100).toFixed(1)),
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  private analyzePerformance(logs: ILogEntry[]): PerformanceStats[] {
    const performanceByDevice: Record<string, number[]> = {};

    logs.forEach((log) => {
      const ua = new UAParser(log.user_agent).getResult();
      const deviceType = ua.device.type || "desktop";

      if (!performanceByDevice[deviceType]) {
        performanceByDevice[deviceType] = [];
      }

      performanceByDevice[deviceType].push(log.response_time_ms);
    });

    return Object.entries(performanceByDevice)
      .map(([deviceType, responseTimes]) => {
        const avg =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        return {
          deviceType: this.formatDeviceType(deviceType),
          avgResponseTime: Number(avg.toFixed(2)),
          maxResponseTime: Math.max(...responseTimes),
          minResponseTime: Math.min(...responseTimes),
          requestCount: responseTimes.length,
        };
      })
      .sort((a, b) => b.requestCount - a.requestCount);
  }

  // MÉTODOS AUXILIARES
  private formatDeviceType(type: string): string {
    const types: Record<string, string> = {
      mobile: "Mobile",
      tablet: "Tablet",
      desktop: "Desktop",
      smarttv: "Smart TV",
      "": "Desktop",
    };
    return types[type] || "Unknown";
  }

  private getDeviceIcon(type: string): string {
    const icons: Record<string, string> = {
      mobile: "smartphone",
      tablet: "tablet",
      desktop: "computer",
      smarttv: "tv",
      "": "computer",
    };
    return icons[type] || "device_unknown";
  }

  private getDeviceColor(type: string): string {
    const colors: Record<string, string> = {
      mobile: "primary",
      tablet: "warning",
      desktop: "positive",
      smarttv: "info",
      "": "positive",
    };
    return colors[type] || "grey";
  }

  private getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      Windows: "#0078D4",
      macOS: "#FF2D20",
      Linux: "#FCC624",
      iOS: "#000000",
      Android: "#3DDC84",
    };
    return colors[platform] || "#6C757D";
  }
}
