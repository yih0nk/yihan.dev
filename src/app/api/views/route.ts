import { NextResponse } from "next/server";
import { getSiteViews, incrementSiteViews } from "@/lib/redis";

export async function GET() {
  const views = await getSiteViews();
  return NextResponse.json({ views });
}

export async function POST() {
  const views = await incrementSiteViews();
  return NextResponse.json({ views });
}
