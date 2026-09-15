import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/utils/movieService";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    return NextResponse.json({ results: await getSearchSuggestions(query) });
  } catch {
    return NextResponse.json({ results: [] });
  }
}