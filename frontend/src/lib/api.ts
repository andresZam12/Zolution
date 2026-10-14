/**
 * API client configuration and helper for Zolution Backend.
 */

function getApiBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_API_URL || "https://zolution-api.onrender.com";
  base = base.trim().replace(/\/+$/, "");
  if (!base.endsWith("/api/v1")) {
    base = `${base}/api/v1`;
  }
  return base;
}

const API_BASE_URL = getApiBaseUrl();


interface RequestOptions extends RequestInit {
  organizationId?: string;
  token?: string;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { organizationId, token, headers = {}, ...rest } = options;

  const resolvedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  const activeOrg =
    organizationId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("zolution_org_slug") || localStorage.getItem("zolution_org_id")
      : undefined);

  if (activeOrg) {
    resolvedHeaders["X-Organization-ID"] = activeOrg;
  }

  const activeToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("zolution_auth_token") || localStorage.getItem("zolution_token")
      : undefined);

  if (activeToken) {
    resolvedHeaders["Authorization"] = `Bearer ${activeToken}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    headers: resolvedHeaders,
    ...rest,
  });

  if (!response.ok) {
    let errorDetail = "API request failed";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
