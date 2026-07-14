import { NextResponse } from "next/server";
import { getIp, rateLimit } from "@/lib/rateLimit";
import { contactSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getIp(request.headers);
  if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
    return NextResponse.json({ message: "Bạn gửi quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }
  const parsed = contactSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu liên hệ chưa hợp lệ." }, { status: 400 });
  }
  if (parsed.data.website) {
    return NextResponse.json({ message: "Đã nhận liên hệ." });
  }

  console.info(JSON.stringify({ level: "info", event: "contact_submission", topic: parsed.data.topic ?? "general", hasEmail: Boolean(parsed.data.email) }));
  return NextResponse.json({ message: "Đã nhận liên hệ. Chúng tôi sẽ phản hồi sớm." }, { status: 202 });
}
