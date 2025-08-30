export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function retry<T>(
  fn: () => Promise<T> | T,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = false,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    onRetry,
    shouldRetry = () => true
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      let waitTime = delayMs;
      if (exponentialBackoff) {
        waitTime = Math.min(
          delayMs * Math.pow(backoffMultiplier, attempt - 1),
          maxDelayMs
        );
      }

      await sleep(waitTime);
    }
  }

  throw lastError;
}
