import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, SessionWithRole } from "@/lib/auth";
import { getAllAdmins, addAdmin, removeAdmin, findAdminByEmail } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admins = await getAllAdmins();
  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as SessionWithRole | null;
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === "add") {
    const existing = await findAdminByEmail(body.email);
    if (existing) {
      return NextResponse.json({ error: "Admin already exists" }, { status: 400 });
    }
    await addAdmin(body.email, body.role, session.user.email);
    return NextResponse.json({ success: true });
  }

  if (body.action === "remove") {
    await removeAdmin(body.rowIndex);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
