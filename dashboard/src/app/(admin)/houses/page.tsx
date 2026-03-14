"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Save, XCircle } from "lucide-react";

interface House {
  rowIndex: number;
  house_number: string;
  resident_name: string;
  line_user_id: string;
  phone: string;
  move_in_date: string;
  is_active: string;
  monthly_rate: string;
  transfer_date: string;
  due_date: string;
  prior_arrears: string;
  prior_arrears_paid: string;
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<House | null>(null);
  const [form, setForm] = useState({ house_number: "", resident_name: "", line_user_id: "", phone: "", move_in_date: "", monthly_rate: "", due_date: "" });

  const fetchHouses = useCallback(async () => {
    const res = await fetch("/api/houses");
    if (res.ok) setHouses(await res.json());
  }, []);

  useEffect(() => { fetchHouses(); }, [fetchHouses]);

  const addHouse = async () => {
    await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", ...form }),
    });
    setDialogOpen(false);
    setForm({ house_number: "", resident_name: "", line_user_id: "", phone: "", move_in_date: "", monthly_rate: "", due_date: "" });
    fetchHouses();
  };

  const saveEdit = async () => {
    if (!editForm) return;
    await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", ...editForm }),
    });
    setEditingRow(null);
    setEditForm(null);
    fetchHouses();
  };

  const toggleActive = async (house: House) => {
    await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        ...house,
        is_active: house.is_active === "TRUE" ? "FALSE" : "TRUE",
      }),
    });
    fetchHouses();
  };

  const startEdit = (house: House) => {
    setEditingRow(house.rowIndex);
    setEditForm({ ...house });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการบ้าน ({houses.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> เพิ่มบ้าน</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มบ้านใหม่</DialogTitle>
              <DialogDescription>กรอกข้อมูลบ้านที่ต้องการเพิ่ม</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>บ้านเลขที่</Label><Input value={form.house_number} onChange={(e) => setForm({ ...form, house_number: e.target.value })} /></div>
                <div><Label>ชื่อผู้อยู่</Label><Input value={form.resident_name} onChange={(e) => setForm({ ...form, resident_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>LINE User ID</Label><Input value={form.line_user_id} onChange={(e) => setForm({ ...form, line_user_id: e.target.value })} /></div>
                <div><Label>เบอร์โทร</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><Label>วันที่เข้าอยู่</Label><Input type="date" value={form.move_in_date} onChange={(e) => setForm({ ...form, move_in_date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>ค่าส่วนกลาง/เดือน</Label><Input type="number" value={form.monthly_rate} onChange={(e) => setForm({ ...form, monthly_rate: e.target.value })} /></div>
                <div><Label>วันครบกำหนดจ่าย</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addHouse}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายชื่อบ้าน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>ชื่อผู้อยู่</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>ค่าส่วนกลาง</TableHead>
                <TableHead>วันครบกำหนด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {houses.map((h) => (
                <TableRow key={h.rowIndex}>
                  {editingRow === h.rowIndex && editForm ? (
                    <>
                      <TableCell><Input className="h-8 w-20" value={editForm.house_number} onChange={(e) => setEditForm({ ...editForm, house_number: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8" value={editForm.resident_name} onChange={(e) => setEditForm({ ...editForm, resident_name: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 w-28" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 w-20" type="number" value={editForm.monthly_rate} onChange={(e) => setEditForm({ ...editForm, monthly_rate: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8" type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></TableCell>
                      <TableCell><Badge variant={editForm.is_active === "TRUE" ? "default" : "secondary"}>{editForm.is_active === "TRUE" ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={saveEdit}><Save className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRow(null); setEditForm(null); }}><XCircle className="h-4 w-4" /></Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{h.house_number}</TableCell>
                      <TableCell>{h.resident_name}</TableCell>
                      <TableCell>{h.phone}</TableCell>
                      <TableCell>{parseFloat(h.monthly_rate || "0").toLocaleString()} ฿</TableCell>
                      <TableCell>{h.due_date}</TableCell>
                      <TableCell>
                        <Switch checked={h.is_active === "TRUE"} onCheckedChange={() => toggleActive(h)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(h)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
