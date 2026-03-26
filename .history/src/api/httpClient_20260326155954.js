const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const DEFAULT_TIMEOUT_MS = 30000;

const withQuery = (url, query) => {
  if (!query) return url;
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

const safeJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return response.json();
};

export const httpRequest = async (path, options = {}) => {
  const {
    method = "GET",
    headers,
    body,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(withQuery(`${API_BASE_URL}${path}`, query), {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    const json = await safeJson(response);

    if (!response.ok) {
      const message =
        json?.message || json?.error || `Request failed: ${response.status}`;
      throw new Error(message);
    }

    return json;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout or aborted");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
