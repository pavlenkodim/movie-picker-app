import { HttpException, HttpStatus } from "@nestjs/common";

interface ApiResponse<T> {
  data: T;
}

interface ErrorsFromTMBD {
  status_code: number;
  status_message: string;
  success: boolean;
}

export default async function tmdbApiService<T>(url: string): Promise<T> {
  const baseUrl = process.env.TMDB_API_URL ?? "https://api.themoviedb.org/3";
  const token = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    throw new HttpException(
      "TMDB_READ_ACCESS_TOKEN is not configured",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
    },
  };

  try {
    console.log("url:", `${baseUrl}/${url}`);
    console.log("options", options);
    const response = await fetch(`${baseUrl}/${url}`, options);
    const data: T = await response.json();
    console.log(data);

    if (!response.ok) {
      const error: ErrorsFromTMBD = await response.json();
      throw new HttpException(error.status_message ?? "TMDB request failed", response.status);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new HttpException(
      `Service unavailable: ${error?.message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
