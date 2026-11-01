export type GeocodingResult = {
  id: string;
  displayName: string;
  title: string;
  context: string | null;
  latitude: number;
  longitude: number;
  category: string | null;
};

export type GeocodingErrorCode =
  | "ABORTED"
  | "TIMEOUT"
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class GeocodingError extends Error {
  constructor(
    public readonly code: GeocodingErrorCode,
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message);
    this.name = "GeocodingError";
  }
}

type GeoapifyResult = {
  place_id?: string;
  formatted?: string;
  name?: string;
  address_line1?: string;
  address_line2?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
  result_type?: string;
  category?: string;
};

type GeoapifyResponse = { results?: GeoapifyResult[] };
type ErrorResponse = { code?: string; message?: string };
type Fetcher = typeof fetch;

const cacheLimit = 100;
const searchCache = new Map<string, GeocodingResult[]>();
const reverseCache = new Map<string, GeocodingResult | null>();

export function normalizeAddressQuery(query: string) {
  return query.normalize("NFC").trim().replace(/\s+/g, " ");
}

function cacheKey(query: string) {
  return normalizeAddressQuery(query).toLocaleLowerCase("vi-VN");
}

function distinct(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values.filter((value): value is string => {
    const normalized = value?.trim();
    if (!normalized) return false;
    const key = normalized.toLocaleLowerCase("vi-VN");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapResult(result: GeoapifyResult): GeocodingResult | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const displayName = result.formatted?.trim();
  if (!displayName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const title = result.address_line1?.trim()
    || result.name?.trim()
    || distinct([result.housenumber, result.street]).join(" ")
    || displayName.split(",")[0]?.trim()
    || displayName;
  const contextParts = distinct([
    result.suburb,
    result.district,
    result.city,
    result.county,
    result.state,
    result.postcode,
  ]).filter((part) => part.toLocaleLowerCase("vi-VN") !== title.toLocaleLowerCase("vi-VN"));

  return {
    id: result.place_id?.trim() || `${latitude}-${longitude}-${displayName}`,
    displayName,
    title,
    context: contextParts.length > 0 ? contextParts.join(" · ") : result.address_line2?.trim() || null,
    latitude,
    longitude,
    category: result.result_type ?? result.category ?? null,
  };
}

function putCache<T>(cache: Map<string, T>, key: string, value: T) {
  if (cache.size >= cacheLimit) cache.delete(cache.keys().next().value ?? "");
  cache.set(key, value);
}

function createRequestSignal(callerSignal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    timeoutMs,
  );
  const abortFromCaller = () => controller.abort(callerSignal?.reason ?? new DOMException("Request aborted", "AbortError"));
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

function errorCode(status: number, providerCode?: string): GeocodingErrorCode {
  if (providerCode === "GEOAPIFY_NOT_CONFIGURED") return "NOT_CONFIGURED";
  if (status === 401 || providerCode === "GEOAPIFY_UNAUTHORIZED") return "UNAUTHORIZED";
  if (status === 403 || providerCode === "GEOAPIFY_FORBIDDEN") return "FORBIDDEN";
  if (status === 429 || providerCode === "GEOAPIFY_RATE_LIMITED") return "RATE_LIMITED";
  if (status === 504 || providerCode === "GEOAPIFY_TIMEOUT") return "TIMEOUT";
  return "PROVIDER_ERROR";
}

async function fetchGeoapifyProxy(fetcher: Fetcher, url: string, signal: AbortSignal) {
  try {
    const response = await fetcher(url, {
      signal,
      headers: { Accept: "application/json", "Accept-Language": "vi-VN,vi;q=0.9" },
    });
    if (!response.ok) {
      let payload: ErrorResponse = {};
      try { payload = await response.json() as ErrorResponse; } catch { /* Ignore non-JSON error bodies. */ }
      throw new GeocodingError(
        errorCode(response.status, payload.code),
        payload.message || `Geocoding proxy returned HTTP ${response.status}.`,
        response.status,
      );
    }
    try {
      return await response.json() as unknown;
    } catch {
      throw new GeocodingError("INVALID_RESPONSE", "Geocoding proxy returned invalid JSON.", response.status);
    }
  } catch (error) {
    const reason = signal.aborted ? signal.reason : error;
    if (reason instanceof GeocodingError) throw reason;
    if (reason instanceof DOMException && reason.name === "TimeoutError") {
      throw new GeocodingError("TIMEOUT", "Geoapify request timed out.");
    }
    if (reason instanceof DOMException && reason.name === "AbortError") {
      throw new GeocodingError("ABORTED", "Geoapify request was aborted.");
    }
    if (error instanceof TypeError) {
      throw new GeocodingError("NETWORK_ERROR", "Could not connect to the geocoding proxy.");
    }
    throw new GeocodingError("PROVIDER_ERROR", "Geoapify request failed.");
  }
}

function mapResponse(body: unknown) {
  if (!body || typeof body !== "object" || !Array.isArray((body as GeoapifyResponse).results)) {
    throw new GeocodingError("INVALID_RESPONSE", "Geoapify response does not contain a results array.");
  }
  return (body as GeoapifyResponse).results!.flatMap((item) => {
    const mapped = mapResult(item);
    return mapped ? [mapped] : [];
  });
}

export function createGeocodingService(fetcher: Fetcher = globalThis.fetch.bind(globalThis)) {
  return {
    async search(query: string, options: { signal?: AbortSignal; timeoutMs?: number } = {}) {
      const normalized = normalizeAddressQuery(query);
      const key = cacheKey(normalized);
      if (normalized.length < 3) return [];
      const cached = searchCache.get(key);
      if (cached) return cached;

      const request = createRequestSignal(options.signal, options.timeoutMs ?? 12_000);
      try {
        const parameters = new URLSearchParams({ text: normalized });
        const results = mapResponse(await fetchGeoapifyProxy(fetcher, `/api/geocoding/autocomplete?${parameters}`, request.signal));
        putCache(searchCache, key, results);
        return results;
      } finally {
        request.dispose();
      }
    },

    async reverse(latitude: number, longitude: number, options: { signal?: AbortSignal; timeoutMs?: number } = {}) {
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return null;
      }
      const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
      if (reverseCache.has(key)) return reverseCache.get(key) ?? null;

      const request = createRequestSignal(options.signal, options.timeoutMs ?? 12_000);
      try {
        const parameters = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });
        const results = mapResponse(await fetchGeoapifyProxy(fetcher, `/api/geocoding/reverse?${parameters}`, request.signal));
        const result = results[0] ?? null;
        putCache(reverseCache, key, result);
        return result;
      } finally {
        request.dispose();
      }
    },
  };
}

export const geocodingService = createGeocodingService();

export function clearGeocodingCacheForTests() {
  searchCache.clear();
  reverseCache.clear();
}
