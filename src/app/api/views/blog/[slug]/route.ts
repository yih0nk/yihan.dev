import { NextResponse } from "next/server";
import { getPostViews, incrementPostViews } from "@/lib/redis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const views = await getPostViews(slug);
  return NextResponse.json({ views });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const views = await incrementPostViews(slug);
  return NextResponse.json({ views });
}
