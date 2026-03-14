import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lineUserId, houseNumber, amount, monthsOverdue } = await req.json();

  if (!lineUserId) {
    return NextResponse.json({ error: "ไม่พบ LINE User ID ของบ้านหลังนี้" }, { status: 400 });
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "LINE token not configured" }, { status: 500 });
  }

  const message = `⚠️ แจ้งเตือนค่าส่วนกลางค้างชำระ\n\nบ้านเลขที่: ${houseNumber}\nค้างชำระ: ${monthsOverdue} เดือน\nยอดรวม: ${amount} บาท\n\nกรุณาชำระค่าส่วนกลางโดยเร็ว ขอบคุณค่ะ`;

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `LINE API error: ${errText}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
