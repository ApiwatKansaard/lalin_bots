import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllPayments, getAllHouses, getSettings, getAllOverdueHouses } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [payments, houses, settings, overdueHouses] = await Promise.all([
    getAllPayments(),
    getAllHouses(),
    getSettings(),
    getAllOverdueHouses(),
  ]);

  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString();
  const currentYear = now.getFullYear().toString();

  // This month's payments
  const thisMonthPayments = payments.filter(
    (p) => p.month === currentMonth && p.year === currentYear
  );
  const collectedThisMonth = thisMonthPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount || "0"),
    0
  );

  const activeHouses = houses.filter((h) => h.is_active === "TRUE");
  const targetThisMonth = activeHouses.reduce(
    (sum, h) => sum + (parseFloat(h.monthly_rate) || 0),
    0
  );
  const outstandingThisMonth = targetThisMonth - collectedThisMonth;

  // Last 12 months chart data
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = (d.getMonth() + 1).toString();
    const y = d.getFullYear().toString();
    const monthPayments = payments.filter((p) => p.month === m && p.year === y);
    const collected = monthPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount || "0"),
      0
    );
    monthlyData.push({
      month: `${m}/${y}`,
      collected,
      target: targetThisMonth,
    });
  }

  // Paid vs unpaid this month
  const paidHousesThisMonth = new Set(thisMonthPayments.map((p) => p.house_number));
  const paidCount = paidHousesThisMonth.size;
  const unpaidCount = activeHouses.length - paidCount;

  // Recent 10 payments
  const recentPayments = [...payments].reverse().slice(0, 10);

  return NextResponse.json({
    stats: {
      collectedThisMonth,
      outstandingThisMonth: Math.max(0, outstandingThisMonth),
      totalHouses: activeHouses.length,
      overdueCount: overdueHouses.length,
    },
    monthlyData,
    pieData: [
      { name: "ชำระแล้ว", value: paidCount },
      { name: "ยังไม่ชำระ", value: unpaidCount },
    ],
    recentPayments,
    settings,
  });
}
