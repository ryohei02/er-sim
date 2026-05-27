import { NextResponse } from "next/server";

// TODO: implement Claude API endpoints
// POST /api/claude/generate — generate a new emergency case
// POST /api/claude/evaluate — evaluate user's differential diagnosis

export async function POST() {
  return NextResponse.json(
    { error: "Claude API integration not yet implemented" },
    { status: 501 }
  );
}
