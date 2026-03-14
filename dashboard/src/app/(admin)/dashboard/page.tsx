"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, Home, AlertTriangle, TrendingUp } from "lucide-react";

interface DashboardData {
  stats: {
    collectedThisMonth: number;
    outstandingThisMonth: number;
    totalHouses: number;
    overdueCount: number;
  };
  monthlyData: { month: string; collected: number; target: number }[];
  pieData: { name: string; value: number }[];
  recentPayments: {
    house_number: string;
    resident_name: string;
    amount: string;
    paid_date: string;
    verified_status: string;
    month: string;
    year: string;
  }[];
  settings: { village_name: string };
}

const PIE_COLORS = ["#16a34a", "#e5e7eb"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">กำลังโหลด...</div>;
  }

  const statCards = [
    { title: "เก็บได้เดือนนี้", value: `${data.stats.collectedThisMonth.toLocaleString()} ฿`, icon: DollarSign, color: "text-green-600" },
    { title: "ยอดคงค้าง", value: `${data.stats.outstandingThisMonth.toLocaleString()} ฿`, icon: TrendingUp, color: "text-orange-600" },
    { title: "บ้านทั้งหมด", value: data.stats.totalHouses.toString(), icon: Home, color: "text-blue-600" },
    { title: "ค้างชำระ", value: `${data.stats.overdueCount} หลัง`, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{data.settings.village_name} — แดชบอร์ด</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">ยอดเก็บรายเดือน (12 เดือนล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ฿`} />
                <Bar dataKey="collected" fill="#16a34a" name="เก็บได้" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#e5e7eb" name="เป้าหมาย" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">สถานะเดือนนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}`}>
                  {data.pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">การชำระเงินล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>ประจำเดือน</TableHead>
                <TableHead>วันที่จ่าย</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentPayments.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.house_number}</TableCell>
                  <TableCell>{p.resident_name}</TableCell>
                  <TableCell>{parseFloat(p.amount).toLocaleString()} ฿</TableCell>
                  <TableCell>{p.month}/{p.year}</TableCell>
                  <TableCell>{p.paid_date}</TableCell>
                  <TableCell>
                    <Badge variant={p.verified_status === "verified" ? "default" : p.verified_status === "rejected" ? "destructive" : "secondary"}>
                      {p.verified_status === "verified" ? "✅ ยืนยัน" : p.verified_status === "rejected" ? "❌ ปฏิเสธ" : "⏳ รอตรวจ"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
