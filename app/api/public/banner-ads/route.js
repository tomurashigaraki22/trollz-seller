import { getLiveBannerAds } from "@/lib/banner-ads";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request) {
  const limit = new URL(request.url).searchParams.get("limit");
  try {
    const ads = await getLiveBannerAds(limit || 10);
    return new Response(JSON.stringify({ ok: true, ads }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60", ...CORS },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Could not load banner ads." }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS },
    });
  }
}
