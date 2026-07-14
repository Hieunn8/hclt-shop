import { NextResponse } from "next/server";
import { getIp, rateLimit } from "@/lib/rateLimit";
import { reviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getIp(request.headers);
  if (!rateLimit(`review:${ip}`, 3, 60_000)) {
    return NextResponse.json({ message: "Bạn gửi quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }
  const parsed = reviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Đánh giá chưa hợp lệ." }, { status: 400 });
  }
  if (parsed.data.website) {
    return NextResponse.json({ message: "Đánh giá đã được gửi và chờ duyệt." });
  }
  console.info(JSON.stringify({ level: "info", event: "review_submission", productSlug: parsed.data.productSlug, rating: parsed.data.rating }));
  return NextResponse.json({ message: "Đánh giá đã được gửi và chờ duyệt." }, { status: 202 });
}
