import { timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getIp, rateLimit } from "@/lib/rateLimit";
import { revalidateSchema, tagsForRevalidate } from "@/lib/validation";

function secretMatches(candidate: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const ip = getIp(request.headers);
  if (!rateLimit(`revalidate:${ip}`, 30, 60_000)) {
    return NextResponse.json({ message: "Rate limit exceeded." }, { status: 429 });
  }
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ message: "Invalid secret." }, { status: 401 });
  }
  const parsed = revalidateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  const tags = tagsForRevalidate(parsed.data.model, parsed.data.slug);
  tags.forEach((tag) => revalidateTag(tag));
  console.info(JSON.stringify({ level: "info", event: "revalidate", model: parsed.data.model, action: parsed.data.action, tags }));
  return NextResponse.json({ revalidated: true, tags });
}
