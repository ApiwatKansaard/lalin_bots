"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Download, Check, X } from "lucide-react";

interface Payment {
  rowIndex: number;
  house_number: string;
  resident_name: string;
  month: string;
  year: string;
  amount: string;
  paid_date: string;
  transaction_ref: string;
  verified_status: string;
  recorded_by: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterHouse, setFilterHouse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ house_number: "", resident_name: "", month: "", year: "", amount: "", paid_date: "" });

  const fetchPayments = useCallback(async () => {
    const res = await fetch("/api/payments");
    if (res.ok) setPayments(await res.json());
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filtered = payments.filter((p) => {
    if (filterMonth && p.month !== filterMonth) return false;
    if (filterYear && p.year !== filterYear) return false;
    if (filterHouse && !p.house_number.includes(filterHouse)) return false;
    if (filterStatus && p.verified_status !== filterStatus) return false;
    return true;
  }).reverse();

  const exportCSV = () => {
    const headers = ["house_number", "resident_name", "month", "year", "amount", "paid_date", "transaction_ref", "verified_status", "recorded_by"];
    const csvContent = [
      headers.join(","),
      ...filtered.map((p) => headers.map((h) => `"${(p as unknown as Record<string, string>)[h] || ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addPayment = async () => {
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", ...form }),
    });
    setDialogOpen(false);
    setForm({ house_number: "", resident_name: "", month: "", year: "", amount: "", paid_date: "" });
    fetchPayments();
  };

  const updateStatus = async (rowIndex: number, status: string) => {
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", rowIndex, status }),
    });
    fetchPayments();
  };

  const years = Array.from(new Set(payments.map((p) => p.year))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">การชำระเงิน</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> เพิ่มรายการ</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มการชำระเงิน (เงินสด)</DialogTitle>
                <DialogDescription>กรอกข้อมูลการชำระเงินสดที่ต้องการบันทึก</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>บ้านเลขที่</Label><Input value={form.house_number} onChange={(e) => setForm({ ...form, house_number: e.target.value })} /></div>
                  <div><Label>ชื่อ</Label><Input value={form.resident_name} onChange={(e) => setForm({ ...form, resident_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>เดือน</Label><Input type="number" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
                  <div><Label>ปี</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
                  <div><Label>จำนวนเงิน</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                </div>
                <div><Label>วันที่จ่าย</Label><Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={addPayment}>บันทึก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="w-32">
            <Label className="text-xs">เดือน</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Label className="text-xs">ปี</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Label className="text-xs">บ้านเลขที่</Label>
            <Input placeholder="ค้นหา..." value={filterHouse} onChange={(e) => setFilterHouse(e.target.value)} />
          </div>
          <div className="w-36">
            <Label className="text-xs">สถานะ</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="verified">ยืนยันแล้ว</SelectItem>
                <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                <SelectItem value="pending">รอตรวจ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการทั้งหมด ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>เดือน/ปี</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>วันที่จ่าย</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.house_number}</TableCell>
                  <TableCell>{p.resident_name}</TableCell>
                  <TableCell>{p.month}/{p.year}</TableCell>
                  <TableCell>{parseFloat(p.amount).toLocaleString()} ฿</TableCell>
                  <TableCell>{p.paid_date}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{p.transaction_ref}</TableCell>
                  <TableCell>
                    <Badge variant={p.verified_status === "verified" ? "default" : p.verified_status === "rejected" ? "destructive" : "secondary"}>
                      {p.verified_status === "verified" ? "✅" : p.verified_status === "rejected" ? "❌" : "⏳"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.verified_status !== "verified" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => updateStatus(p.rowIndex, "verified")}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {p.verified_status !== "rejected" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => updateStatus(p.rowIndex, "rejected")}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
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
