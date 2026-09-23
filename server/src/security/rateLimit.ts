/**
 * Limitation de debit simple (seau a jetons) appliquee par socket.
 * Objectif : empecher un client de saturer le serveur ou de marteler les
 * actions de jeu, sans jamais gener un joueur normal.
 */
export interface BucketConfig {
  /** Capacite du seau (rafale autorisee). */
  capacity: number;
  /** Jetons regeneres par seconde. */
  refillPerSecond: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly config: BucketConfig) {}

  /** Consomme un jeton. Renvoie `false` si la limite est atteinte. */
  take(key: string, now = Date.now()): boolean {
    const bucket = this.buckets.get(key) ?? { tokens: this.config.capacity, updatedAt: now };
    const elapsed = (now - bucket.updatedAt) / 1000;
    bucket.tokens = Math.min(
      this.config.capacity,
      bucket.tokens + elapsed * this.config.refillPerSecond,
    );
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      this.buckets.set(key, bucket);
      return false;
    }
    bucket.tokens -= 1;
    this.buckets.set(key, bucket);
    return true;
  }

  /** Oublie un client (deconnexion). */
  forget(key: string): void {
    this.buckets.delete(key);
  }

  /** Oublie toutes les cles prefixees (toutes les actions d'un socket). */
  forgetPrefix(prefix: string): void {
    for (const key of this.buckets.keys()) {
      if (key.startsWith(prefix)) {
        this.buckets.delete(key);
      }
    }
  }

  get size(): number {
    return this.buckets.size;
  }
}

/** Limites par type d'evenement. */
export const RATE_LIMITS: Record<string, BucketConfig> = {
  /** Limite globale par socket : rafale de 25, 10 evenements/seconde. */
  global: { capacity: 25, refillPerSecond: 10 },
  /** Creation de room : 5 d'affilee, puis 1 toutes les 6 secondes. */
  'room:create': { capacity: 5, refillPerSecond: 1 / 6 },
  /** Tentatives de connexion a une room : anti-devinette de code. */
  'room:join': { capacity: 10, refillPerSecond: 1 / 3 },
  'player:reconnect': { capacity: 10, refillPerSecond: 1 / 3 },
  /** Actions de jeu : largement suffisant pour un humain. */
  action: { capacity: 12, refillPerSecond: 2 },
};
