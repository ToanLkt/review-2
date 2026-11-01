import { MapTileError, parseMapTileCoordinates, requestMapTile } from "@/lib/server/map-tiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  try {
    const coordinates = parseMapTileCoordinates(await params);
    const tile = await requestMapTile(
      coordinates.z,
      coordinates.x,
      coordinates.y,
      request.signal,
    );
    return new Response(tile.body, {
      headers: {
        "Content-Type": tile.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const status = error instanceof MapTileError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Không thể tải lớp bản đồ.";
    return Response.json(
      { success: false, message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
