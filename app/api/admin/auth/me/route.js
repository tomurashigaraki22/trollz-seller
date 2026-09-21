import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-session";

export async function GET() {
  try {
    const context = await getAdminContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
    }
    return NextResponse.json({ ok: true, admin: context.admin });
  } catch (error) {
    console.error("Admin session lookup failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load the admin session." }, { status: 500 });
  }
}
