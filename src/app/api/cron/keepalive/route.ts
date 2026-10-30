import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // Validate that the request came securely from Vercel's Cron scheduler
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized scheduling context." },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();
    
    // Perform a lightweight database operation to trigger platform activity metrics
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Keep-alive ping failed." },
      { status: 500 }
    );
  }
}
