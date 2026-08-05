import { NextResponse } from "next/server";
import { getPostViews, incrementPostViews } from "@/lib/redis";

// Catch-all so multi-segment slugs like "life/yc-startup-school" resolve
// (a single [slug] segment 404s on the slash). Segments are rejoined into the
// same "views:blog:<category>/<slug>" Redis key the counter expects.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const views = await getPostViews(slug.join("/"));
  return NextResponse.json({ views });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const views = await incrementPostViews(slug.join("/"));
  return NextResponse.json({ views });
}
