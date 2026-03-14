"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface Admin {
  rowIndex: number;
  email: string;
  role: string;
  added_date: string;
  added_by: string;
}

export default function AdminsPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const isSuperAdmin = (session as { role?: string } | null)?.role === "super_admin";

  const fetchAdmins = useCallback(async () => {
    const res = await fetch("/api/admins");
    if (res.ok) setAdmins(await res.json());
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const addAdmin = async () => {
    if (!email) return;
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", email, role }),
    });
    if (res.ok) {
      setEmail("");
      fetchAdmins();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const removeAdmin = async (admin: Admin) => {
    if (!confirm(`ลบ ${admin.email} ออกจากระบบ?`)) return;
    await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", rowIndex: admin.rowIndex }),
    });
    fetchAdmins();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">จัดการผู้ดูแลระบบ</h1>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เพิ่มผู้ดูแลใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1">
                <Label className="text-xs">อีเมล</Label>
                <Input placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="w-40">
                <Label className="text-xs">บทบาท</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addAdmin}><Plus className="mr-2 h-4 w-4" /> เพิ่ม</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายชื่อผู้ดูแล ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>อีเมล</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>วันที่เพิ่ม</TableHead>
                <TableHead>เพิ่มโดย</TableHead>
                {isSuperAdmin && <TableHead>จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.rowIndex}>
                  <TableCell className="font-medium">{a.email}</TableCell>
                  <TableCell>
                    <Badge variant={a.role === "super_admin" ? "default" : a.role === "admin" ? "secondary" : "outline"}>
                      {a.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.added_date}</TableCell>
                  <TableCell>{a.added_by}</TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => removeAdmin(a)}
                        disabled={a.email === session?.user?.email}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
