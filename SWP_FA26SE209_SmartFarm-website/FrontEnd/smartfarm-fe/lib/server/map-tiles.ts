const GEOAPIFY_TILE_BASE_URL = "https://maps.geoapify.com/v1/tile/osm-carto";
const OPENSTREETMAP_TILE_BASE_URL = "https://tile.openstreetmap.org";
const TILE_TIMEOUT_MS = 8_000;

export class MapTileError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MapTileError";
  }
}

export function parseMapTileCoordinates(parameters: { z: string; x: string; y: string }) {
  const z = Number(parameters.z);
  const x = Number(parameters.x);
  const y = Number(parameters.y);
  if (![z, x, y].every(Number.isInteger) || z < 0 || z > 19) {
    throw new MapTileError("Tọa độ ô bản đồ không hợp lệ.", 400);
  }
  const maxCoordinate = 2 ** z;
  if (x < 0 || x >= maxCoordinate || y < 0 || y >= maxCoordinate) {
    throw new MapTileError("Tọa độ ô bản đồ nằm ngoài phạm vi.", 400);
  }
  return { z, x, y };
}

function tileProviderUrls(z: number, x: number, y: number) {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  const urls: URL[] = [];
  if (apiKey) {
    const geoapifyUrl = new URL(`${GEOAPIFY_TILE_BASE_URL}/${z}/${x}/${y}.png`);
    geoapifyUrl.searchParams.set("apiKey", apiKey);
    urls.push(geoapifyUrl);
  }
  urls.push(new URL(`${OPENSTREETMAP_TILE_BASE_URL}/${z}/${x}/${y}.png`));
  return urls;
}

export async function requestMapTile(
  z: number,
  x: number,
  y: number,
  callerSignal?: AbortSignal,
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Map tile request timed out", "TimeoutError")),
    TILE_TIMEOUT_MS,
  );
  const abortFromCaller = () => controller.abort(callerSignal?.reason ?? new DOMException("Request aborted", "AbortError"));
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    for (const url of tileProviderUrls(z, x, y)) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9",
            "User-Agent": "SmartFarm-Web/1.0",
          },
          signal: controller.signal,
          cache: "no-store",
        });
        const contentType = response.headers.get("content-type") ?? "";
        if (response.ok && contentType.startsWith("image/")) {
          return {
            body: await response.arrayBuffer(),
            contentType,
          };
        }
      } catch (error) {
        if (controller.signal.aborted) throw error;
        // Try the next configured provider.
      }
    }
    throw new MapTileError("Không thể tải lớp bản đồ từ các nhà cung cấp.", 502);
  } catch (error) {
    if (error instanceof MapTileError) throw error;
    if (callerSignal?.aborted) throw error;
    throw new MapTileError("Yêu cầu lớp bản đồ quá thời gian.", 504);
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}
