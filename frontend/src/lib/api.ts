// src/lib/api.ts
import { headers } from "next/headers";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

export async function fetchFromBackend<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  const incomingHeaders = await headers();

  try {
    const res = await fetch(`${PYTHON_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        // Forward incoming cookie and authorization headers to FastAPI
        cookie: incomingHeaders.get("cookie") || "",
        authorization: incomingHeaders.get("authorization") || "",
        ...options.headers,
      },
      // Cache controls: use { cache: "no-store" } or Next.js tags
      cache: options.cache || "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Error fetching from backend [${endpoint}]:`, error);
    return null;
  }
}
