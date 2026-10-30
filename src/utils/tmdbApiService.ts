import { HttpException, HttpStatus } from "@nestjs/common";

interface ErrorsFromTMBD {
  status_code: number;
  status_message: string;
  success: boolean;
}

const MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function tmdbApiService<T>(
  url: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const baseUrl = process.env.TMDB_API_URL ?? "https://api.themoviedb.org/3";
  const token = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    throw new HttpException(
      "TMDB_READ_ACCESS_TOKEN is not configured",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const queryString = params
    ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    : "";

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/${url}${queryString}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Don't let a hanging TMDB request hang the user request
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(`Service unavailable: ${error}`, HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Rate limited: wait as long as TMDB asks and try again
    if (response.status === HttpStatus.TOO_MANY_REQUESTS && attempt < MAX_RETRIES) {
      const retryAfterSec = Number(response.headers.get("retry-after"));
      await sleep(retryAfterSec > 0 ? retryAfterSec * 1000 : DEFAULT_RETRY_DELAY_MS);
      continue;
    }

    const data = await response.json().catch(() => null);

    // Keep the original status so callers can tell 404 from 429 etc.
    if (!response.ok) {
      const error = data as ErrorsFromTMBD | null;
      throw new HttpException(error?.status_message ?? "TMDB request failed", response.status);
    }

    return data as T;
  }
}
