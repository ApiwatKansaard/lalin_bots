"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Bot, QrCode } from "lucide-react";

interface Settings {
  bank_account_number: string;
  bank_name: string;
  village_name: string;
}

export default function LineSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    alert("บันทึกเรียบร้อย");
  };

  if (!settings) return <div className="flex h-64 items-center justify-center text-muted-foreground">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่าหมู่บ้าน & LINE Bot</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลหมู่บ้าน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>ชื่อหมู่บ้าน</Label>
              <Input value={settings.village_name} onChange={(e) => setSettings({ ...settings, village_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>ชื่อธนาคาร</Label>
              <Input value={settings.bank_name} onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })} />
            </div>
            <div>
              <Label>เลขบัญชีธนาคาร</Label>
              <Input value={settings.bank_account_number} onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5" /> LINE Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono">
              https://lalin-bots.onrender.com/webhook
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">LINE Bot QR Code</Label>
            <div className="mt-1 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-muted-foreground" />
              <a
                href="https://line.me/R/ti/p/@lalin-village"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                เปิด LINE Bot
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
