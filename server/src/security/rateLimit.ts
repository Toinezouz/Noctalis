/**
 * Simple per-socket rate limiting (token bucket).
 * Goal: stop a client from flooding the server or hammering game actions,
 * without ever getting in the way of a normal player.
 */
export interface BucketConfig {
  /** Bucket capacity (allowed burst). */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSecond: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly config: BucketConfig) {}

  /** Takes a token. Returns `false` when the limit is reached. */
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

  /** Forgets a client (disconnection). */
  forget(key: string): void {
    this.buckets.delete(key);
  }

  /** Forgets every prefixed key (all the actions of a socket). */
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

/** Limits per event type. */
export const RATE_LIMITS: Record<string, BucketConfig> = {
  /** Global limit per socket: bursts of 25, 10 events per second. */
  global: { capacity: 25, refillPerSecond: 10 },
  /** Room creation: 5 in a row, then 1 every 6 seconds. */
  'room:create': { capacity: 5, refillPerSecond: 1 / 6 },
  /** Attempts to join a room: stops code guessing. */
  'room:join': { capacity: 10, refillPerSecond: 1 / 3 },
  'player:reconnect': { capacity: 10, refillPerSecond: 1 / 3 },
  /** Game actions: plenty for a human. */
  action: { capacity: 12, refillPerSecond: 2 },
};
