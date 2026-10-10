import { NextResponse } from "next/server";
import { getAdminUserOverview } from "@/utils/adminUsers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const allowedBanDurations = new Set(["24h", "168h", "720h", "876000h", "none"]);

async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { response: NextResponse.json({ error: profileError.message }, { status: 500 }) };
  }
  if (profile?.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }

  try {
    return { admin: createAdminClient(), adminId: user.id };
  } catch (error) {
    return {
      response: NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to initialize admin services." },
        { status: 500 },
      ),
    };
  }
}

export async function GET() {
  const authorization = await authorizeAdmin();
  if ("response" in authorization) return authorization.response;

  try {
    return NextResponse.json({ users: await getAdminUserOverview(authorization.admin) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load member accounts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin();
  if ("response" in authorization) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A valid request body is required." }, { status: 400 });
  }

  const { userId, duration } = body as { userId?: unknown; duration?: unknown };
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "A valid user ID is required." }, { status: 400 });
  }
  if (typeof duration !== "string" || !allowedBanDurations.has(duration)) {
    return NextResponse.json({ error: "Choose a supported ban duration." }, { status: 400 });
  }
  if (userId === authorization.adminId) {
    return NextResponse.json({ error: "You cannot ban your own admin account." }, { status: 400 });
  }

  try {
    const { data: target, error: targetError } = await authorization.admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw new Error(targetError.message);
    if (target?.role === "admin") {
      return NextResponse.json({ error: "Admin accounts cannot be managed here." }, { status: 403 });
    }

    const { error } = await authorization.admin.auth.admin.updateUserById(userId, {
      ban_duration: duration,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the account ban." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdmin();
  if ("response" in authorization) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("userId" in body) || typeof body.userId !== "string") {
    return NextResponse.json({ error: "A valid user ID is required." }, { status: 400 });
  }
  const userId = body.userId;

  if (userId === authorization.adminId) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }

  try {
    const { data: target, error: targetError } = await authorization.admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw new Error(targetError.message);
    if (target?.role === "admin") {
      return NextResponse.json({ error: "Admin accounts cannot be managed here." }, { status: 403 });
    }

    const { error } = await authorization.admin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete the account." },
      { status: 500 },
    );
  }
}
