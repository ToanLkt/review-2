import { NextResponse } from "next/server";
import { geoapifyErrorPayload, requestGeoapify } from "@/lib/server/geoapify";

export const runtime = "nodejs";

function validCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const latitude = Number(parameters.get("lat"));
  const longitude = Number(parameters.get("lng"));
  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) {
    return NextResponse.json(
      { success: false, code: "INVALID_COORDINATES", message: "Tọa độ không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const body = await requestGeoapify("reverse", {
      lat: String(latitude),
      lon: String(longitude),
      limit: "1",
    }, request.signal);
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=3600, stale-while-revalidate=3600" },
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const payload = geoapifyErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
