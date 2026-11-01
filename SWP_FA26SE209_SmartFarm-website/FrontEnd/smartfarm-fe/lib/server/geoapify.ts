const GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1/geocode";
const GEOAPIFY_TIMEOUT_MS = 10_000;

export type GeoapifyProxyErrorCode =
  | "GEOAPIFY_NOT_CONFIGURED"
  | "GEOAPIFY_UNAUTHORIZED"
  | "GEOAPIFY_FORBIDDEN"
  | "GEOAPIFY_RATE_LIMITED"
  | "GEOAPIFY_TIMEOUT"
  | "GEOAPIFY_UNAVAILABLE"
  | "GEOAPIFY_INVALID_RESPONSE";

export class GeoapifyProxyError extends Error {
  constructor(
    public readonly code: GeoapifyProxyErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GeoapifyProxyError";
  }
}

export async function requestGeoapify(
  operation: "autocomplete" | "reverse",
  parameters: Record<string, string>,
  callerSignal?: AbortSignal,
) {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    throw new GeoapifyProxyError(
      "GEOAPIFY_NOT_CONFIGURED",
      "Geoapify chưa được cấu hình. Quản trị viên cần thêm GEOAPIFY_API_KEY vào môi trường triển khai.",
      503,
    );
  }

  const url = new URL(`${GEOAPIFY_BASE_URL}/${operation}`);
  url.search = new URLSearchParams({
    ...parameters,
    format: "json",
    lang: "vi",
    apiKey,
  }).toString();

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Geoapify request timed out", "TimeoutError")),
    GEOAPIFY_TIMEOUT_MS,
  );
  const abortFromCaller = () => controller.abort(callerSignal?.reason ?? new DOMException("Request aborted", "AbortError"));
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "Accept-Language": "vi-VN,vi;q=0.9" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) throw new GeoapifyProxyError("GEOAPIFY_UNAUTHORIZED", "Geoapify API key không hợp lệ.", 401);
      if (response.status === 403) throw new GeoapifyProxyError("GEOAPIFY_FORBIDDEN", "Geoapify API key không có quyền hoặc bị giới hạn nguồn truy cập.", 403);
      if (response.status === 429) throw new GeoapifyProxyError("GEOAPIFY_RATE_LIMITED", "Geoapify đã đạt giới hạn truy cập.", 429);
      throw new GeoapifyProxyError("GEOAPIFY_UNAVAILABLE", `Geoapify trả về HTTP ${response.status}.`, 502);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new GeoapifyProxyError("GEOAPIFY_INVALID_RESPONSE", "Geoapify không trả về JSON hợp lệ.", 502);
    }
    return await response.json() as unknown;
  } catch (error) {
    if (error instanceof GeoapifyProxyError) throw error;
    const reason = controller.signal.aborted ? controller.signal.reason : error;
    if (reason instanceof DOMException && reason.name === "AbortError" && callerSignal?.aborted) throw reason;
    if (reason instanceof DOMException && reason.name === "TimeoutError") {
      throw new GeoapifyProxyError("GEOAPIFY_TIMEOUT", "Geoapify phản hồi quá thời gian.", 504);
    }
    throw new GeoapifyProxyError("GEOAPIFY_UNAVAILABLE", "Không thể kết nối tới Geoapify.", 502);
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export function geoapifyErrorPayload(error: unknown) {
  if (error instanceof GeoapifyProxyError) {
    return {
      status: error.status,
      body: { success: false, code: error.code, message: error.message },
    };
  }
  return {
    status: 502,
    body: { success: false, code: "GEOAPIFY_UNAVAILABLE", message: "Dịch vụ địa chỉ đang tạm gián đoạn." },
  };
}
