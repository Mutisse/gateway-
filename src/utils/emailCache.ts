class EmailCheckCache {
  private cache: Map<string, { exists: boolean; timestamp: number }> =
    new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(email: string, exists: boolean): void {
    this.cache.set(email.toLowerCase(), {
      exists,
      timestamp: Date.now(),
    });
  }

  get(email: string): { exists: boolean; timestamp: number } | null {
    const cached = this.cache.get(email.toLowerCase());
    if (!cached) return null;

    // Verificar se o cache expirou
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(email.toLowerCase());
      return null;
    }

    return cached;
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [email, data] of this.cache.entries()) {
      if (now - data.timestamp > this.TTL) {
        this.cache.delete(email);
      }
    }
  }
}

export const emailCache = new EmailCheckCache();
