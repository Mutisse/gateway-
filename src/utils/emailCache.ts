class EmailCache {
  private cache: Map<string, boolean>;
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000; // Converter para milissegundos
  }

  set(email: string, exists: boolean): void {
    this.cache.set(email, exists);

    // Remover automaticamente após TTL
    setTimeout(() => {
      this.cache.delete(email);
    }, this.ttl);
  }

  get(email: string): boolean | undefined {
    return this.cache.get(email);
  }

  clear(): void {
    this.cache.clear();
  }

  // ✅ CORRIGIDO: Adicionar método size()
  size(): number {
    return this.cache.size;
  }

  // ✅ MÉTODO EXTRA: Ver estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl,
      entries: Array.from(this.cache.entries()),
    };
  }
}

export const emailCache = new EmailCache();
