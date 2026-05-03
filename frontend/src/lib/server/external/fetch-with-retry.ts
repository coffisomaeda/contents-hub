const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryable = (status: number) => status === 429 || (status >= 500 && status < 600);

export const fetchWithRetry = async (
  url: URL | string,
  options?: RequestInit,
  maxRetries = 3,
): Promise<Response> => {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) return response;

    if (!isRetryable(response.status) || attempt === maxRetries) {
      return response;
    }

    lastResponse = response;

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const waitMs = !isNaN(retryAfterSec) ? retryAfterSec * 1000 : Math.pow(2, attempt) * 1000;

    await sleep(waitMs);
  }

  return lastResponse!;
};
