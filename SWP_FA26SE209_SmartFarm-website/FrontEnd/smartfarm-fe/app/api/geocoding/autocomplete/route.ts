import { NextResponse } from "next/server";
import { geoapifyErrorPayload, requestGeoapify } from "@/lib/server/geoapify";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("text")?.normalize("NFC").trim().replace(/\s+/g, " ") ?? "";
  if (query.length < 3) {
    return NextResponse.json(
      { success: false, code: "INVALID_QUERY", message: "Địa chỉ phải có ít nhất 3 ký tự." },
      { status: 400 },
    );
  }
  if (query.length > 200) {
    return NextResponse.json(
      { success: false, code: "INVALID_QUERY", message: "Địa chỉ không được vượt quá 200 ký tự." },
      { status: 400 },
    );
  }

  try {
    const body = await requestGeoapify("autocomplete", {
      text: query,
      filter: "countrycode:vn",
      bias: "countrycode:vn",
      limit: "5",
    }, request.signal);
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=300" },
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const payload = geoapifyErrorPayload(error);
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
