"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface OverdueHouse {
  house_number: string;
  resident_name: string;
  line_user_id: string;
  months_overdue: number;
  total_amount_owed: number;
  unpaid_months: string[];
}

export default function OverduePage() {
  const [houses, setHouses] = useState<OverdueHouse[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/overdue");
    if (res.ok) setHouses(await res.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendReminder = async (house: OverdueHouse) => {
    setSending(house.house_number);
    try {
      const res = await fetch("/api/line/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: house.line_user_id,
          houseNumber: house.house_number,
          amount: house.total_amount_owed,
          monthsOverdue: house.months_overdue,
        }),
      });
      if (res.ok) {
        alert(`ส่งแจ้งเตือนไปยังบ้านเลขที่ ${house.house_number} แล้ว`);
      } else {
        const data = await res.json();
        alert(`ผิดพลาด: ${data.error}`);
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ค้างชำระ ({houses.length} หลัง)</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการบ้านค้างชำระ เรียงจากมากไปน้อย</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>เดือนค้าง</TableHead>
                <TableHead>ยอดค้าง</TableHead>
                <TableHead>เดือนที่ค้าง</TableHead>
                <TableHead>แจ้งเตือน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {houses.map((h) => (
                <TableRow
                  key={h.house_number}
                  className={cn(h.months_overdue >= 3 && "bg-red-50 hover:bg-red-100")}
                >
                  <TableCell className="font-medium">{h.house_number}</TableCell>
                  <TableCell>{h.resident_name}</TableCell>
                  <TableCell>
                    <span className={cn("font-bold", h.months_overdue >= 3 ? "text-red-600" : "text-orange-600")}>
                      {h.months_overdue} เดือน
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{h.total_amount_owed.toLocaleString()} ฿</TableCell>
                  <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                    {h.unpaid_months.slice(-6).join(", ")}
                    {h.unpaid_months.length > 6 && ` (+${h.unpaid_months.length - 6})`}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!h.line_user_id || sending === h.house_number}
                      onClick={() => sendReminder(h)}
                    >
                      <Send className="mr-1 h-3 w-3" />
                      {sending === h.house_number ? "กำลังส่ง..." : "ส่ง LINE"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {houses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ไม่มีบ้านค้างชำระ 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
