const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// --- KV cache ---

export const buildCacheKey = (prefix: string, ...parts: string[]): string =>
  [prefix, ...parts].join(':');

export const getFromCache = async <T>(
  kv: KVNamespace | undefined,
  key: string,
): Promise<T | null> => {
  if (!kv) return null;

  const value = await kv.get(key, 'json');
  return (value as T | null) ?? null;
};

export const setToCache = async (
  kv: KVNamespace | undefined,
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> => {
  if (!kv) return;
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
};

// --- Token bucket ---

type TokenBucketState = {
  tokens: number;
  lastRefillAt: number;
};

export type TokenBucketConfig = {
  bucket: string;
  maxTokens: number;
  refillRatePerSecond: number;
};

const TOKEN_BUCKET_KEY_PREFIX = 'token_bucket';
const MAX_WAIT_ATTEMPTS = 5;

const computeRefilled = (state: TokenBucketState, config: TokenBucketConfig): number => {
  const elapsedSec = (Date.now() - state.lastRefillAt) / 1000;
  return Math.min(config.maxTokens, state.tokens + elapsedSec * config.refillRatePerSecond);
};

export const consumeToken = async (kv: KVNamespace, config: TokenBucketConfig): Promise<void> => {
  const key = buildCacheKey(TOKEN_BUCKET_KEY_PREFIX, config.bucket);

  for (let attempt = 0; attempt < MAX_WAIT_ATTEMPTS; attempt++) {
    const now = Date.now();
    const stored = await kv.get<TokenBucketState>(key, 'json');
    const state: TokenBucketState = stored ?? { tokens: config.maxTokens, lastRefillAt: now };

    const tokens = computeRefilled(state, config);

    if (tokens >= 1) {
      await kv.put(key, JSON.stringify({ tokens: tokens - 1, lastRefillAt: now }), {
        expirationTtl: 3600,
      });
      return;
    }

    const waitMs = Math.ceil(((1 - tokens) / config.refillRatePerSecond) * 1000);
    await sleep(waitMs);
  }
};
