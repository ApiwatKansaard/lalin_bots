import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllHouses, addHouse, updateHouse } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const houses = await getAllHouses();
  return NextResponse.json(houses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "add") {
    await addHouse({
      house_number: body.house_number,
      resident_name: body.resident_name,
      line_user_id: body.line_user_id || "",
      phone: body.phone || "",
      move_in_date: body.move_in_date || new Date().toISOString().split("T")[0],
      is_active: "TRUE",
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "update") {
    await updateHouse(body.rowIndex, {
      house_number: body.house_number,
      resident_name: body.resident_name,
      line_user_id: body.line_user_id || "",
      phone: body.phone || "",
      move_in_date: body.move_in_date || "",
      is_active: body.is_active,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
