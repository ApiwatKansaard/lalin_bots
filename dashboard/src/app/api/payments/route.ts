import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllPayments, addPaymentRecord, updatePaymentStatus } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await getAllPayments();
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "add") {
    await addPaymentRecord({
      house_number: body.house_number,
      resident_name: body.resident_name,
      month: body.month,
      year: body.year,
      amount: body.amount,
      paid_date: body.paid_date || new Date().toISOString().split("T")[0],
      transaction_ref: body.transaction_ref || "MANUAL",
      slip_image_url: "",
      verified_status: "verified",
      recorded_by: session.user.email,
      discount: body.discount || "0",
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "updateStatus") {
    await updatePaymentStatus(body.rowIndex, body.status);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
