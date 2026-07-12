import { HttpException, HttpStatus } from "@nestjs/common";

interface ErrorsFromTMBD {
  status_code: number;
  status_message: string;
  success: boolean;
}

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

  try {
    const response = await fetch(`${baseUrl}/${url}${queryString}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data: T = await response.json();

    if (!response.ok) {
      const error = data as ErrorsFromTMBD;
      throw new HttpException(error.status_message ?? "TMDB request failed", response.status);
    }

    return data as T;
  } catch (error) {
    console.error(error);
    throw new HttpException(`Service unavailable: ${error}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
